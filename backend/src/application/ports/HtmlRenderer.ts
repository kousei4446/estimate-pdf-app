export interface HtmlRenderer<TPayload> {
  render(payload: TPayload): string;
}
