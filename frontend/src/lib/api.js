// One switch decides where data comes from.
//   VITE_USE_MOCK=true  (default) -> sample data stored in the browser, no backend needed
//   VITE_USE_MOCK=false           -> the real Express API
// Pages only ever import `api` from here, so switching needs no page changes.
import { mockApi } from "./mockApi";
import { realApi } from "./realApi";

export const USE_MOCK = import.meta.env.VITE_USE_MOCK !== "false";
export const api = USE_MOCK ? mockApi : realApi;
