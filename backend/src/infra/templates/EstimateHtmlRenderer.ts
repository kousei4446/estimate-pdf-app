import type { EstimatePayload } from "../../domain/entities/EstimatePayload.js";
import type { HtmlRenderer } from "../../application/ports/HtmlRenderer.js";
import {
  computeEstimate,
  escapeHtml,
  resolveDate,
  yen,
} from "../../domain/services/estimateCalculator.js";

export class EstimateHtmlRenderer implements HtmlRenderer<EstimatePayload> {
  render(payload: EstimatePayload): string {
    const computed = computeEstimate(payload);

    const dateText = escapeHtml(resolveDate(payload.date));
    const customer = escapeHtml(payload.customer || "");
    const stampImageDataUrl = sanitizeImageDataUrl(payload.stampImageDataUrl);
    const staffImageDataUrl = sanitizeImageDataUrl(payload.staffImageDataUrl);
    const creatorImageDataUrl = sanitizeImageDataUrl(payload.creatorImageDataUrl);
    const showStamp = payload.showStamp ?? true;

    const overrideTotal = Number.isFinite(Number(payload.estimateTotal))
      ? Number(payload.estimateTotal)
      : computed.total;

    const company = escapeHtml(payload.company || payload.issuerName || "");
    const companyMain = escapeHtml(payload.companyMain || payload.issuerTitle || "");
    const postId = escapeHtml(formatPostalCode(payload.postId || ""));
    const address = escapeHtml(payload.address || payload.issuerAddr || "");
    const tel = escapeHtml(payload.tel || payload.issuerTel || "");
    const phone = escapeHtml(payload.phone || payload.issuerMobile || "");
    const addressLine = [postId, address].filter((v) => v).join(" ");
    const telText = formatPhone(tel);
    const phoneText = formatPhone(phone);
    const phoneLine = `${telText ? `:${telText}` : ""}${phoneText ? `　携帯:${phoneText}` : ""}`;

    const projectName = escapeHtml(payload.projectName || "");
    const projectPlace = escapeHtml(payload.projectPlace || "");
    const validity = escapeHtml(payload.validity || "1??");
    const payment = escapeHtml(payload.payment || "????");

    const MAX_ROWS = 8;
    const items = computed.items.slice(0, MAX_ROWS);
    const emptyCount = Math.max(0, MAX_ROWS - items.length);
    const renderImage = (dataUrl: string | undefined, alt: string, className?: string) => {
      if (!dataUrl) return "";
      const classAttr = className ? ` class="${className}"` : "";
      return `<img${classAttr} src="${dataUrl}" alt="${alt}" />`;
    };

    const itemRows =
      items
        .map((item) => {
          const amountClass = item.amount < 0 ? "num negative" : "num";
          return `
            <tr class="row">
              <td class="col-item">${item.name}</td>
              <td class="col-spec center">${item.spec || ""}</td>
              <td class="col-unitprice num">${item.unitPrice ? `&yen;${yen(item.unitPrice)}` : ""}</td>
              <td class="col-qty center">${item.quantity ? String(item.quantity) : ""}</td>
              <td class="col-unit center">${item.unit || ""}</td>
              <td class="col-amount ${amountClass}">${item.amount ? `&yen;${yen(item.amount)}` : ""}</td>
            </tr>
          `;
        })
        .join("") +
      Array.from({ length: emptyCount })
        .map(
          () => `
            <tr class="row">
              <td class="col-item">&nbsp;</td>
              <td class="col-spec">&nbsp;</td>
              <td class="col-unitprice">&nbsp;</td>
              <td class="col-qty">&nbsp;</td>
              <td class="col-unit">&nbsp;</td>
              <td class="col-amount">&nbsp;</td>
            </tr>
          `
        )
        .join("");

    const totalText = `&yen;${yen(overrideTotal)}`;
    const subtotalText = `&yen;${yen(computed.subtotal)}`;
    const taxText = `&yen;${yen(computed.tax)}`;

    return `
    <!doctype html>
<html lang="ja">
<head>
<meta charset="utf-8" />
<title>御　見　積　書</title>
<style>
  @page { size: A4 landscape; margin: 10mm; }

  :root{
    --b: 2px solid #000;
    --b-thin: 1px solid #000;
  }

  * { box-sizing: border-box; }

  body{
    margin: 0;
    font-family: "Noto Sans CJK JP", "Noto Sans JP", "Hiragino Kaku Gothic ProN", "Meiryo", sans-serif;
    color:#000;
    font-size: 10.5pt;
    line-height: 1.25;
  }

  .page{ width:100%; }

  /* ===== Header ===== */
  .header{
    position: relative;
    padding-top: 1mm;
  }

  .date-wrap{
    position:absolute;
    right:0;
    top:0;
    text-align:right;
  }
  .date{ font-size: 9pt; }
  .date-rule{
    margin-top: 2mm;
    width: 67mm;           /* 参考PDFの右上線に寄せる */
    border-top: var(--b);
    margin-left: auto;
  }

  .title{
    text-align:center;
    font-family: "Noto Serif CJK JP","Noto Serif JP","MS Mincho",serif;
    font-size: 16pt;
    letter-spacing: 0.35em;
    margin: 0;
  }
  .title-rule{
    width: 62mm;           /* 参考PDFの中央下線に寄せる */
    border-top: var(--b);
    margin: 2mm auto 0;
  }

  .honorific{
    text-align:center;
    font-family: "Noto Serif CJK JP","Noto Serif JP","MS Mincho",serif;
    font-size: 14pt;
    font-weight: 600;
    margin-top: 2mm;
  }

  /* ===== Top layout ===== */
  .top{
    display:flex;
    justify-content: space-between; /* 左右を離して中央に余白を作る */
    align-items:flex-start;
    margin-top: 2mm;
  }

  /* 参考PDFに合わせて、左右を固定幅にして中央余白を確保 */
  .left-col{ width: 30%; }
  .right-col{ width: 40%; }

  /* 宛名（左上に配置） */
  .customer-left{
    text-align:center;
    font-size: 11pt;
    font-weight: 500;
    /* margin: 0 0 2mm 0; */
  }

  .ontyu{
    font-size: 14pt;
    font-weight: 600;
    width: 30%;
  }


  table{ border-collapse: collapse; width:100%; table-layout: fixed; }

  /* ===== Amount box (左上 金額枠) ===== */

  .amount-box th,
  .amount-box td{
    /* border: var(--b); */
    border-bottom: 2px solid #000;
    padding: 2mm 2mm;
    text-align:center;
    vertical-align: middle;
    font-weight: 500;
  }
  .amount-box th{ width: 32mm; }
  .amount-box .big{
    font-size: 12pt;
    font-weight: 700;
  }

  /* amount → info の間（参考PDFの空きに寄せる） */
  .gap-lg{ height: 8mm; }

  /* ===== Info table (左中 工事情報) ===== */

  .info-table th,
  .info-table td{
    border-bottom: 2px solid #000;
    padding: 2mm 2mm;
    text-align:center;
    vertical-align: middle;
    font-weight: 500;
  }
  .info-table th{ width: 32mm; }

  /* ===== Issuer box (右上 発行者枠＋角印) ===== */
  .issuer-box{
    border: var(--b);
    padding: 3mm;
    height: 38mm; /* 参考PDFの高さ感 */
  }
  .issuer-top{
    display:flex;
    justify-content: space-between;
    align-items:flex-start;
    gap: 3mm;
    height: 100%;
  }
  .issuer-subject{
    font-weight: 500;
    margin-bottom: 1mm;
  }
  .issuer-meta{
    font-size: 8.5pt;
    margin-top: 1mm;
  }
  .issuer-name{
    font-size: 16pt;
    font-weight: 800;
    margin: 1mm 0;
    letter-spacing: 0.06em;
  }

  /* 角印スペース（枠線は付けない：参考PDFの見え方に寄せる） */
  .seal-space{
    width: 32mm;
    height: 32mm;
    flex: 0 0 auto;
    display:flex;
    align-items:flex-start;
    justify-content:flex-end;
  }
  .seal-space img{
    max-width: 32mm;
    max-height: 32mm;
    object-fit: contain;
    display:block;
  }

  /* ===== Approval (右中 承認枠) ===== */
  .approval{
    margin-top: 6mm;
  }
  .approval table{
    width: 78mm;           /* 参考PDF：右寄せで小さめ */
    margin-left: auto;
    border: var(--b);
  }
  .approval th,
  .approval td{
    border: var(--b);
    text-align:center;
    vertical-align: middle;
    padding: 1.5mm 0;
    font-weight: 600;
  }
  .approval td{
    height: 20mm;
    font-weight: 500;
  }
  .approval-image{
    max-width: 100%;
    max-height: 18mm;
    object-fit: contain;
    display:block;
    margin: 0 auto;
  }

  /* ===== Items table (明細) ===== */
  .items-wrap{ margin-top: 6mm; }

  .items{
    border: var(--b);
    width: 100%;
  }
  .items th,
  .items td{
    border: var(--b);
    padding: 1.6mm 2mm;
    text-align: center;     /* 参考PDFは中央寄り */
    vertical-align: middle;
    font-weight: 500;
  }
  .items thead th{
    font-weight: 700;
  }
  .items tbody td{
    height: 9mm;           /* 行の高さ感 */
  }

  .col-item{ width: 120mm; }
  .col-spec{ width: 22mm; }
  .col-unitprice{ width: 22mm; }
  .col-qty{ width: 22mm; }
  .col-unit{ width: 24mm; }
  .col-amount{ width: auto; }

  .num{ text-align: right; white-space: nowrap; }
  .negative{ color:#d00; }

  /* 複数ページ化した時にヘッダー繰り返し（Chrome系PDF化で有効） */
  .items thead{ display: table-header-group; }
  .items tr{ page-break-inside: avoid; }

  /* ===== Bottom (備考＋消費税込) ===== */
  .bottom{
    display:flex;
    align-items: stretch;
    margin-top: 3mm;
  }

  .remarks{
    flex: 1;
    border: var(--b);
    display:flex;
    flex-direction: column;
  }
  .remarks-title{
    border-bottom: var(--b);
    text-align:center;
    font-weight: 700;
    padding: 1.5mm 0;
  }
  .remarks-body{
    padding: 1mm 2mm 2mm;
    font-size: 7.2pt;
    line-height: 1.25;
    flex: 1;
  }
  .remarks-line{
    padding: 1mm 0;
    border-bottom: var(--b-thin);
  }

  .right-summary{
    width: 90mm;            /* 参考PDFの右下枠の幅感 */
    border: var(--b);
    border-left: none;      /* 備考枠と連結して見えるように */
    display:flex;
    flex-direction: column;
  }

  /* 上の空白エリアにも縦線（見本PDFの仕切り線を再現） */
  .right-blank{
    flex: 1;
    border-bottom: var(--b);
    display: grid;
    grid-template-columns: 28mm 1fr; /* 「消費税込」ラベル幅に合わせる */
  }
  .right-blank .blank-left{
    border-right: var(--b);
  }
  .right-blank .blank-right{ }

  .taxin{
    width: 100%;
    border-collapse: collapse;
  }
  .taxin td{
    padding: 3mm 3mm;
    font-weight: 700;
    border: none;
  }
  .taxin td.lbl{
    width: 28mm;
    text-align: center;
    border-right: var(--b);
  }
  .taxin td.val{
    text-align: center;
    white-space: nowrap;
  }

  /* 折返し安全策 */
  .issuer-meta, .issuer-name, .items td, .items th{
    overflow-wrap: anywhere;
    word-break: break-word;
  }
</style>
</head>

<body>
  <div class="page">

    <div class="header">
      <div class="date-wrap">
        <div class="date">${dateText}</div>
        <div class="date-rule"></div>
      </div>

      <h1 class="title">御　見　積　書</h1>
      <div class="title-rule"></div>
    </div>

    <div class="top">
      <!-- LEFT -->
      <div class="left-col">
        <div class="customer-left" style="border-bottom: 2px #000 solid;" >
          ${customer || "&nbsp;"}
        </div>

        <table class="amount-box">
          <tr>
            <th style="border-right: 2px #000 solid;">御見積金額</th>
            <td class="big" colspan="3">${totalText}</td>
          </tr>
          <tr>
            <th style="border-right: 2px #000 solid;">小計</th>
            <td style="border-right: 2px #000 solid;">${subtotalText}</td>
            <th style="border-right: 2px #000 solid;">消費税</th>
            <td>${taxText}</td>
          </tr>
        </table>

        <div class="gap-lg"></div>

        <table class="info-table">
          <tr>
            <th style="border-right: 2px #000 solid;">工事名称</th>
            <td>改修工事</td>
          </tr>
          <tr>
            <th style="border-right: 2px #000 solid;">工事場所</th>
            <td>貴社指定場所</td>
          </tr>
          <tr>
            <th style="border-right: 2px #000 solid;">見積有効期間</th>
            <td>1ヶ月</td>
          </tr>
          <tr>
            <th style="border-right: 2px #000 solid;">御支払条件</th>
            <td>現金払い</td>
          </tr>
        </table>
      </div>
      <div class="ontyu">御中</div>

      <!-- RIGHT -->
      <div class="right-col">
        <div class="issuer-box">
          <div class="issuer-top">
            <div>
              <div class="issuer-subject">${projectName || "&nbsp;"}</div>
              <div class="issuer-meta">${companyMain || ""}</div>
              <div class="issuer-name">${company || "&nbsp;"}</div>
              <div class="issuer-meta">${addressLine || ""}</div>
              <div class="issuer-meta">${phoneLine || ""}</div>
            </div>

            <div class="seal-space">
              ${creatorImageDataUrl
                ? '<img src="' + creatorImageDataUrl + '" alt="印影" />'
                : ''
              }
            </div>
          </div>
        </div>

        <div class="approval">
          <table>
            <tr>
              <th>承認</th>
              <th>担当者</th>
              <th>作成者</th>
            </tr>
            <tr>
              <td></td>
              <td>
                ${staffImageDataUrl
                  ? '<img class="approval-image" src="' + staffImageDataUrl + '" alt="担当者" />'
                  : ''
                }
              </td>
              <td>
                ${creatorImageDataUrl
                  ? '<img class="approval-image" src="' + creatorImageDataUrl + '" alt="作成者" />'
                  : ''
                }
              </td>
            </tr>
          </table>
        </div>
      </div>
    </div>

    <div class="items-wrap">
      <table class="items">
        <thead>
          <tr>
            <th class="col-item">項目</th>
            <th class="col-spec">規格</th>
            <th class="col-unitprice">単価</th>
            <th class="col-qty">数量</th>
            <th class="col-unit">単位(㎡)</th>
            <th class="col-amount">金額</th>
          </tr>
        </thead>
        <tbody>
          ${itemRows}
        </tbody>
      </table>
    </div>

    <div class="bottom">
      <div class="remarks">
        <div class="remarks-title">備考</div>
        <div class="remarks-body">
          <div class="remarks-line">※台風、強風時のシート養生は含まれていません。※足場の管理は施工引渡し後から足場撤去までの移管貴社の責任において管理するものとします。</div>
          <div class="remarks-line">（手摺や踏板、斜材、壁繋ぎ、シートなどやむを得なく外した場合、作業後復旧するものとします。復旧せず倒壊、転落災害、資材などの落下が起こった</div>
          <div class="remarks-line">場合弊社で責任は取れません）※足場設置期間は60日以内とします。契約期間以上の使用、リース品の過度の汚れ、破損、滅失などについては別途請求</div>
          <div class="remarks-line" style="border-bottom:none;">致します。※新築工事:最大3工程 改修工事:最大2工程、それ以上は別途請求致します。※上記以外の工事については全て追加工事とさせて頂きます。</div>
        </div>
      </div>

      <div class="right-summary">
        <div class="right-blank">
          <div class="blank-left"></div>
          <div class="blank-right"></div>
        </div>
        <table class="taxin">
          <tr>
            <td class="lbl">消費税込</td>
            <td class="val">${totalText}</td>
          </tr>
        </table>
      </div>
    </div>

  </div>
</body>
</html>

    `
;
  }
}
function sanitizeImageDataUrl(imageDataUrl: string | undefined) {
  if (!imageDataUrl) return undefined;
  const trimmed = imageDataUrl.trim();
  const isSafeBase64Image = /^data:image\/(png|jpe?g|svg\+xml);base64,[A-Za-z0-9+/=]+$/i;
  return isSafeBase64Image.test(trimmed) ? trimmed : undefined;
}

function formatPhone(raw: string | undefined) {
  if (!raw) return "";
  const digits = raw.replace(/[^\d]/g, "");
  if (digits.length === 11) {
    return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`;
  }
  if (digits.length === 10) {
    if (digits.startsWith("03") || digits.startsWith("06")) {
      return `${digits.slice(0, 2)}-${digits.slice(2, 6)}-${digits.slice(6)}`;
    }
    return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`;
  }
  return raw;
}

function formatPostalCode(raw: string) {
  if (!raw) return "";
  const digits = raw.replace(/[^\d]/g, "");
  if (digits.length === 7) {
    return `${digits.slice(0, 3)}-${digits.slice(3)}`;
  }
  return raw;
}

