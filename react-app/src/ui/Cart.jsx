import { useState } from "react";
import { moduleCatalog } from "../data/catalog";
import { CUSHION_PRICE } from "../data/colors";
import { useConfigurator } from "../state/configurator";

const fmt = (n) => `${n.toLocaleString("ko-KR")}원`;

export default function Cart() {
  const modules = useConfigurator((s) => s.modules);
  const material = useConfigurator((s) => s.material);
  const options = useConfigurator((s) => s.options);
  const setOptionQty = useConfigurator((s) => s.setOptionQty);
  const [open, setOpen] = useState(false);

  const moduleLines = modules.reduce((acc, m) => {
    const spec = moduleCatalog[m.type];
    const unit = spec.price?.[material === "naturalLeather" ? "leather" : "fabric"] || 0;
    if (!acc[m.type]) acc[m.type] = { label: spec.label, qty: 0, unit };
    acc[m.type].qty += 1;
    return acc;
  }, {});
  const lines = Object.values(moduleLines);
  const cushionLines = Object.entries(options.cushion).map(([label, qty]) => ({
    cushion: true,
    label: `쿠션 ${label}`,
    rawLabel: label,
    qty,
    unit: CUSHION_PRICE
  }));
  const all = [...lines, ...cushionLines];
  const total = all.reduce((s, l) => s + l.qty * l.unit, 0);
  const totalCount = modules.length;

  return (
    <>
      <button
        className="cart-toggle"
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
      >
        <span>구성 모듈 <strong className="cart-toggle-count">{totalCount}</strong> 개</span>
        <span className="cart-toggle-icon">{open ? "▲" : "▼"}</span>
      </button>
      {open && (
        <ul className="cart-list">
          {all.map((line, i) => (
            <li key={i} className="cart-item">
              <div className="cart-item-info">
                <p className="cart-item-name">{line.label}</p>
                {line.cushion ? (
                  <span className="cart-qty-control">
                    <button className="cart-qty-btn" onClick={() => setOptionQty("cushion", line.rawLabel, line.qty - 1)}>−</button>
                    <span className="cart-qty-num">{line.qty}</span>
                    <button className="cart-qty-btn" onClick={() => setOptionQty("cushion", line.rawLabel, line.qty + 1)}>+</button>
                  </span>
                ) : (
                  <span className="cart-item-qty">{line.qty}</span>
                )}
              </div>
              <div className="cart-item-side">
                {line.cushion && (
                  <button className="cart-item-remove" onClick={() => setOptionQty("cushion", line.rawLabel, 0)}>×</button>
                )}
                <span className="cart-item-price">{fmt(line.qty * line.unit)}</span>
              </div>
            </li>
          ))}
        </ul>
      )}
      <div className="checkout-row">
        <a className="checkout-info" href="#">주문시 안내사항 ›</a>
        <div className="checkout-total">
          <div className="total-row">
            <span className="total-label">총 금액</span>
            <strong>{fmt(total)}</strong>
          </div>
          <span className="total-tax">ⓘ 부가세 미포함가</span>
        </div>
      </div>
      <button className="checkout-btn" type="button">장바구니 담기</button>
      {/* 모바일 collapsed 뷰: 토글 아래 인라인 total + cart 아이콘 */}
      <div className="checkout-mobile">
        <span className="checkout-mobile-label">TOTAL</span>
        <strong className="checkout-mobile-total">{fmt(total)}</strong>
        <button className="checkout-mobile-cart" type="button" aria-label="장바구니 담기">
          <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="9" cy="21" r="1.4" />
            <circle cx="18" cy="21" r="1.4" />
            <path d="M3 4h2.4l2.6 12.5a2 2 0 0 0 2 1.5h8.4a2 2 0 0 0 2-1.5L22 8H6" />
          </svg>
        </button>
      </div>
    </>
  );
}
