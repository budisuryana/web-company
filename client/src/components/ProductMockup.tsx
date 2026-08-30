/** Design system: Software Almanac — product folios are the hero, rendered like calm editorial artifacts. */
import { Check, ChevronDown, FileText, MoreHorizontal, Play, Plus, Search, Sparkles } from "lucide-react";

export type ProductMockupProduct = { slug: string; name: string };

type ProductMockupProps = {
  product: ProductMockupProduct;
  compact?: boolean;
  framed?: boolean;
};

const MiniBar = ({ width = "72%", accent = false }: { width?: string; accent?: boolean }) => (
  <span className={`mini-bar ${accent ? "is-accent" : ""}`} style={{ width }} />
);

export default function ProductMockup({ product, compact = false, framed = true }: ProductMockupProps) {
  const classes = `product-mockup ${product.slug} ${compact ? "is-compact" : ""} ${framed ? "is-framed" : ""}`;

  return (
    <div className={classes} aria-label={`${product.name} product interface preview`}>
      <div className="mockup-topbar">
        <span className="window-dots"><i /><i /><i /></span>
        <span className="mockup-crumb"><b>{product.name}</b><span>/</span> Workspace</span>
        <MoreHorizontal size={15} strokeWidth={1.7} />
      </div>

      {product.slug === "hris" && <HrisInterface />}
      {product.slug === "remuneration" && <RemunerationInterface />}
      {product.slug === "ticketing" && <TicketingInterface />}
      {product.slug === "reportforge" && <ReportForgeInterface />}
      {product.slug === "kontenjadi" && <KontenJadiInterface />}
      {!["hris", "remuneration", "ticketing", "reportforge", "kontenjadi"].includes(product.slug) && <GenericInterface product={product} />}
    </div>
  );
}

function HrisInterface() {
  return (
    <div className="mockup-layout hris-layout">
      <aside className="mockup-sidebar">
        <div className="mini-brand"><span className="brand-box" /> <MiniBar width="58%" /></div>
        <div className="nav-lines"><MiniBar width="66%" accent /><MiniBar width="52%" /><MiniBar width="71%" /><MiniBar width="45%" /></div>
        <div className="sidebar-profile"><span className="avatar">AM</span><div><MiniBar width="62%" /><MiniBar width="42%" /></div></div>
      </aside>
      <div className="mockup-main">
        <div className="mockup-heading"><div><p>People overview</p><h4>Your team, in one place</h4></div><button className="mockup-action"><Plus size={12} /> Add employee</button></div>
        <div className="metric-row"><Metric label="Team members" value="128" /><Metric label="On leave" value="06" /><Metric label="Attendance" value="96%" /></div>
        <div className="panel-directory"><div className="panel-title"><div><h5>Employee directory</h5><MiniBar width="30%" /></div><Search size={14} /></div>{["AK", "RS", "MN", "DT"].map((initials, index) => <div className="employee-line" key={initials}><span className={`avatar avatar-${index}`}>{initials}</span><div><MiniBar width={index % 2 ? "76%" : "90%"} /><MiniBar width="48%" /></div><span className="status-dot" /></div>)}</div>
      </div>
    </div>
  );
}

function RemunerationInterface() {
  return (
    <div className="mockup-layout remuneration-layout">
      <aside className="mockup-sidebar"><div className="mini-brand"><span className="brand-box" /> <MiniBar width="54%" /></div><div className="nav-lines"><MiniBar width="54%" /><MiniBar width="70%" accent /><MiniBar width="49%" /><MiniBar width="64%" /></div><div className="sidebar-note"><MiniBar width="75%" /><MiniBar width="51%" /></div></aside>
      <div className="mockup-main"><div className="mockup-heading"><div><p>Q4 review cycle</p><h4>Allocation overview</h4></div><button className="mockup-action">Review changes</button></div><div className="allocation-summary"><div><span>Available pool</span><strong>Rp 2.4B</strong><MiniBar width="62%" /></div><div className="ring-chart"><i /><b>82%</b></div></div><div className="allocation-table"><div className="table-head"><span>Team</span><span>Suggested</span><span>State</span></div>{[72, 54, 87, 43].map((size, index) => <div className="allocation-line" key={size}><span><MiniBar width={`${size}%`} /></span><span><MiniBar width="65%" /></span><span className={index === 0 ? "approval is-live" : "approval"}>{index === 0 ? "Ready" : "Review"}</span></div>)}</div></div>
    </div>
  );
}

function TicketingInterface() {
  const groups = ["In focus", "Building", "Ready to test"];
  return (
    <div className="mockup-layout ticketing-layout">
      <aside className="mockup-sidebar"><div className="mini-brand"><span className="brand-box" /> <MiniBar width="54%" /></div><div className="nav-lines"><MiniBar width="60%" accent /><MiniBar width="48%" /><MiniBar width="69%" /><MiniBar width="40%" /></div><div className="sidebar-profile"><span className="avatar">TS</span><div><MiniBar width="59%" /><MiniBar width="38%" /></div></div></aside>
      <div className="mockup-main"><div className="mockup-heading"><div><p>Product delivery</p><h4>Release: steady work</h4></div><button className="mockup-action"><Plus size={12} /> New task</button></div><div className="kanban-board">{groups.map((group, column) => <div className="kanban-column" key={group}><div className="kanban-head"><span>{group}</span><i>{column + 2}</i></div>{[0, 1, 2].slice(0, column === 1 ? 3 : 2).map((card) => <div className="task-card" key={card}><span className={`task-mark mark-${(card + column) % 3}`} /><MiniBar width={card === 1 ? "58%" : "82%"} /><MiniBar width="45%" /><div><span className="task-avatar">{["A", "N", "D"][card]}</span><MiniBar width="25%" /></div></div>)}</div>)}</div></div>
    </div>
  );
}

function ReportForgeInterface() {
  return (
    <div className="mockup-layout reportforge-layout">
      <aside className="template-rail"><div className="mini-brand"><span className="brand-box" /> <MiniBar width="55%" /></div><div className="template-title"><FileText size={13} /> Templates</div>{["Monthly", "Overview", "Summary", "Report"].map((item, index) => <div className={`template-item ${index === 1 ? "is-active" : ""}`} key={item}><span>{item}</span><ChevronDown size={12} /></div>)}<button className="new-template"><Plus size={12} /> New template</button></aside>
      <div className="document-canvas"><div className="document-toolbar"><span><FileText size={13} /> Workforce report</span><button><Play size={12} fill="currentColor" /> Render</button></div><article className="document-sheet"><div className="doc-kicker">Quarterly overview</div><h4>People & operations</h4><MiniBar width="88%" /><MiniBar width="77%" /><div className="doc-split"><div className="doc-chart"><div className="chart-bars"><i /><i /><i /><i /></div><MiniBar width="42%" /></div><div className="doc-stats"><MiniBar width="66%" /><strong>96.4%</strong><MiniBar width="44%" /></div></div><div className="doc-table"><span /><span /><span /><span /><span /><span /></div></article></div>
    </div>
  );
}

function KontenJadiInterface() {
  const steps = ["Idea", "Direction", "Script", "Produce", "Publish", "Distribute"];
  return (
    <div className="mockup-layout kontenjadi-layout">
      <aside className="workflow-rail"><div className="mini-brand"><span className="brand-box" /> <MiniBar width="51%" /></div><span className="workflow-label">Content flow</span><div className="workflow-list">{steps.map((step, index) => <div className={`workflow-step ${index === 2 ? "is-current" : ""}`} key={step}><span>{index + 1}</span><MiniBar width={index === 3 ? "56%" : "68%"} /></div>)}</div></aside>
      <div className="content-workspace"><div className="mockup-heading"><div><p>Episode 014</p><h4>Make the brief useful</h4></div><div className="publish-state"><Check size={12} /> In progress</div></div><div className="content-columns"><article className="script-sheet"><span className="script-label">SCRIPT</span><h5>What makes a tool worth keeping?</h5><MiniBar width="92%" /><MiniBar width="80%" /><MiniBar width="86%" /><div className="script-highlight"><Sparkles size={13} /><MiniBar width="72%" /></div><MiniBar width="84%" /><MiniBar width="59%" /></article><aside className="storyboard"><div className="story-title"><span>Storyboard</span><Plus size={13} /></div>{["hook", "context", "close"].map((scene, index) => <div className="scene" key={scene}><span className={`scene-thumb thumb-${index}`}><Play size={11} fill="currentColor" /></span><div><MiniBar width="80%" /><MiniBar width="47%" /></div></div>)}</aside></div></div>
    </div>
  );
}

function GenericInterface({ product }: { product: ProductMockupProduct }) {
  return <div className="mockup-layout"><aside className="mockup-sidebar"><div className="mini-brand"><span className="brand-box" /> <MiniBar width="58%" /></div><div className="nav-lines"><MiniBar width="66%" accent /><MiniBar width="52%" /><MiniBar width="71%" /><MiniBar width="45%" /></div></aside><div className="mockup-main"><div className="mockup-heading"><div><p>Product workspace</p><h4>{product.name}</h4></div><button className="mockup-action"><Plus size={12} /> Create</button></div><div className="metric-row"><Metric label="In review" value="08" /><Metric label="Complete" value="24" /><Metric label="Progress" value="81%" /></div><div className="panel-directory"><div className="panel-title"><div><h5>Connected work</h5><MiniBar width="30%" /></div><Search size={14} /></div>{["A", "B", "C", "D"].map((initial, index) => <div className="employee-line" key={initial}><span className={`avatar avatar-${index}`}>{initial}</span><div><MiniBar width={index % 2 ? "76%" : "90%"} /><MiniBar width="48%" /></div><span className="status-dot" /></div>)}</div></div></div>;
}

function Metric({ label, value }: { label: string; value: string }) {
  return <div className="metric"><span>{label}</span><strong>{value}</strong><i /></div>;
}
