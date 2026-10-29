import Image from "next/image";

type ProjectVisualProps = {
  variant: "dashboard" | "localaid" | "furniture" | "bookvoice" | "casatoon" | "ccr" | "lifedesk-crm" | "lifedesk" | "joyno-accounting" | "enzi" | "joyno-chatbot";
};

function LocalAidVisual() {
  return (
    <div className="visual visual--localaid">
      <Image
        className="localaid-preview"
        src="/images/projects/localaid.webp"
        alt="LocalAid mobile home screen with request and offer help actions"
        width={920}
        height={1920}
        sizes="(max-width: 767px) 42vw, 180px"
      />
    </div>
  );
}

function DashboardVisual() {
  return (
    <div className="visual visual--dashboard">
      <Image
        src="/images/projects/hr.webp"
        alt="Joyno HR operations dashboard"
        fill
        sizes="(max-width: 767px) 100vw, 720px"
        unoptimized
      />
    </div>
  );
}

function LifeDeskVisual() {
  return (
    <div className="visual visual--lifedesk">
      <Image
        src="/images/projects/lifedesk-home.webp"
        alt="LifeDesk home screen with an empty local wallet and pinned actions"
        width={430}
        height={930}
        sizes="(max-width: 767px) 42vw, 180px"
      />
    </div>
  );
}

function WebsiteVisual({ src, alt, position = "center" }: { src: string; alt: string; position?: string }) {
  return (
    <div className="visual visual--website">
      <Image
        src={src}
        alt={alt}
        fill
        sizes="(max-width: 767px) 52vw, (max-width: 1200px) 36vw, 430px"
        style={{ objectPosition: position }}
      />
    </div>
  );
}

export function ProjectVisual({ variant }: ProjectVisualProps) {
  if (variant === "dashboard") return <DashboardVisual />;
  if (variant === "localaid") return <LocalAidVisual />;
  if (variant === "ccr") return <WebsiteVisual src="/images/projects/ccr.webp" alt="CCR local demo dashboard with empty business records" />;
  if (variant === "lifedesk-crm") return <WebsiteVisual src="/images/projects/lifedesk-crm.webp" alt="LifeDesk CRM empty-state workspace, with no prospect records" position="center top" />;
  if (variant === "lifedesk") return <LifeDeskVisual />;
  if (variant === "furniture") return (
    <WebsiteVisual
      src="/images/projects/bw.webp"
      alt="B&W Customized Furnitures website home page"
      position="46% center"
    />
  );
  if (variant === "casatoon") return (
    <WebsiteVisual
      src="/images/projects/casatoon.webp"
      alt="CasaToon home page: Bring Your Stories to Life, with a film-strip frame of an animated boy and lion"
      position="60% center"
    />
  );
  if (variant === "joyno-accounting") return (
    <WebsiteVisual
      src="/images/projects/joyno-accounting.webp"
      alt="Joyno Accounting dashboard with revenue and expenses, tax calendar, balance health and recent activity"
      position="center top"
    />
  );
  if (variant === "enzi") return (
    <WebsiteVisual
      src="/images/projects/enzi/01-hero.webp"
      alt="Enzi notch open on the music player at the top of a Windows desktop, with the floating to-do widget"
      position="center top"
    />
  );
  if (variant === "joyno-chatbot") return (
    <WebsiteVisual
      src="/images/projects/joyno-chatbot/03-chat-answer-with-page-button.webp"
      alt="Joyno Chatbot answering a visitor on a business website, with a View Services button"
      position="right center"
    />
  );
  return (
    <WebsiteVisual
      src="/images/projects/book.webp"
      alt="BookVoice local-first audiobook studio desktop interface"
      position="48% center"
    />
  );
}
