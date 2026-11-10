import assert from "node:assert/strict"
import test from "node:test"

import { totalTahfidzLines } from "./tahsin-tahfidz.ts"

test("totalTahfidzLines sums entered weeks and ignores blanks", () => {
  assert.equal(
    totalTahfidzLines([
      { tahfidzLines: 6 },
      { tahfidzLines: null },
      { tahfidzLines: 7 },
      { tahfidzLines: 0 },
    ]),
    13
  )
})
