import { syncSacramentoAppeals } from "../lib/sync/sacramento";

let page = 1;
let totals = { seen: 0, upserted: 0, skipped: 0, failed: 0 };
const maxPages = Number(process.env.SACRAMENTO_SYNC_MAX_PAGES ?? 20);

while (page <= maxPages) {
  const result = await syncSacramentoAppeals({
    page,
    limit: 100,
    trigger: "scheduled",
  });
  totals = {
    seen: totals.seen + result.seen,
    upserted: totals.upserted + result.upserted,
    skipped: totals.skipped + result.skipped,
    failed: totals.failed + result.failed,
  };
  if (!result.nextPage) break;
  page = result.nextPage;
}

process.stdout.write(
  `${JSON.stringify({ pages: page, ...totals }, null, 2)}\n`,
);

if (totals.failed > 0) process.exitCode = 1;
