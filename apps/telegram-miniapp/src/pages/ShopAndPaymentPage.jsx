import React, { useState } from "react";

export function ShopAndPaymentPage({ onDispatch }) {
  const [amount, setAmount] = useState(500000);

  return (
    <div className="p-4 space-y-4 bg-[#111827] text-slate-100 rounded-lg">
      <h2 className="text-base font-bold">
        Telegram Mini App — Shop Code, VietQR & Dịch Vụ MXH
      </h2>
      <div className="flex items-center gap-2 text-xs">
        <input
          type="number"
          value={amount}
          onChange={(e) => setAmount(Number(e.target.value))}
          className="px-3 py-2 bg-[#0B0F17] border border-slate-800 rounded font-mono"
        />
        <button
          onClick={() =>
            onDispatch?.("nap_tien", { amountVnd: amount, bankCode: "MBBank" })
          }
          className="px-4 py-2 bg-emerald-500 text-slate-950 font-semibold rounded"
        >
          Nạp Tự Động VietQR
        </button>
      </div>
    </div>
  );
}
