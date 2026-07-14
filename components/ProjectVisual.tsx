type ProjectVisualProps = { variant: "mobile" | "dashboard" | "restaurant" };

function MobileVisual() {
  return (
    <div className="visual visual--mobile" aria-hidden="true">
      <div className="phone">
        <div className="phone-notch" />
        <b>SakAI</b>
        <h5>Where are<br />you going?</h5>
        <span>○ Cebu City</span><span>○ Mandaue City</span><button tabIndex={-1}>Find Route</button>
      </div>
    </div>
  );
}

function DashboardVisual() {
  return (
    <div className="visual visual--dashboard" aria-hidden="true">
      <div className="dash-sidebar"><b>HR</b><i /><i /><i /><i /></div>
      <div className="dash-main">
        <small>Dashboard</small>
        <div className="dash-stats"><span><b>128</b>Employees</span><span><b>16</b>Leave</span></div>
        <strong>Recent Activities</strong>
        <p>● &nbsp;Juan Dela Cruz</p><p>● &nbsp;Maria Santos</p><p>● &nbsp;Pedro Reyes</p>
      </div>
    </div>
  );
}

function RestaurantVisual() {
  return (
    <div className="visual visual--restaurant" aria-hidden="true">
      <nav><b>savora</b><span>Menu&nbsp;&nbsp; About</span></nav>
      <div className="restaurant-copy"><h5>SAVOR<br />DELICIOUS<br />MOMENTS</h5><p>Fresh ingredients. Bold flavor.</p><button tabIndex={-1}>Explore Menu</button></div>
      <div className="plate"><i /><i /><i /><i /></div>
    </div>
  );
}

export function ProjectVisual({ variant }: ProjectVisualProps) {
  if (variant === "mobile") return <MobileVisual />;
  if (variant === "dashboard") return <DashboardVisual />;
  return <RestaurantVisual />;
}
