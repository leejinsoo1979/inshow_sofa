import { moduleCatalog } from "../data/catalog";
import { CUSHION_PRICE } from "../data/colors";
import { useConfigurator } from "../state/configurator";

const fmt = (n) => `${n.toLocaleString("ko-KR")}원`;

export default function Cart() {
  const modules = useConfigurator((s) => s.modules);
  const material = useConfigurator((s) => s.material);
  const options = useConfigurator((s) => s.options);
  const setOptionQty = useConfigurator((s) => s.setOptionQty);

  // 모듈 합계
  const moduleLines = modules.reduce((acc, m) => {
    const spec = moduleCatalog[m.type];
    const unit = spec.price?.[material === "naturalLeather" ? "leather" : "fabric"] || 0;
    const key = m.type;
    if (!acc[key]) acc[key] = { label: spec.label, qty: 0, unit };
    acc[key].qty += 1;
    return acc;
  }, {});
  const lines = Object.values(moduleLines);

  // 옵션
  const cushionLines = Object.entries(options.cushion).map(([label, qty]) => ({
    group: "cushion",
    label: `쿠션 ${label}`,
    qty,
    unit: CUSHION_PRICE
  }));

  const all = [...lines, ...cushionLines];
  const total = all.reduce((s, l) => s + l.qty * l.unit, 0);
  const totalCount = modules.length;

  return (
    <div className="cart-section">
      <div className="cart-toggle-row">
        <span>구성 모듈</span>
        <strong>{totalCount}개</strong>
      </div>
      <ul className="cart-list">
        {all.map((line, i) => (
          <li key={i} className="cart-item">
            <div className="cart-item-name">{line.label}</div>
            <div className="cart-item-qty">
              {line.group === "cushion" ? (
                <>
                  <button onClick={() => setOptionQty("cushion", line.label.replace("쿠션 ", ""), line.qty - 1)}>−</button>
                  <span>{line.qty}</span>
                  <button onClick={() => setOptionQty("cushion", line.label.replace("쿠션 ", ""), line.qty + 1)}>+</button>
                </>
              ) : (
                <span>{line.qty}</span>
              )}
            </div>
            <div className="cart-item-price">{fmt(line.qty * line.unit)}</div>
          </li>
        ))}
      </ul>
      <div className="cart-total">
        <span>총 금액</span>
        <strong>{fmt(total)}</strong>
      </div>
      <div className="cart-vat-note">부가세 미포함가</div>
      <button className="cart-cta">장바구니 담기</button>
    </div>
  );
}
