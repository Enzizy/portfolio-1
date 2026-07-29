import Image from "next/image";

type ProjectVisualProps = {
  variant: "dashboard" | "localaid" | "streetkings" | "furniture" | "bookvoice" | "roarly";
};

function LocalAidVisual() {
  return (
    <div className="visual visual--localaid">
      <Image
        className="localaid-preview"
        src="/images/projects/localaid.png"
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
        src="/images/projects/hr.png"
        alt="Joyno HR operations dashboard"
        fill
        sizes="(max-width: 767px) 100vw, 720px"
        unoptimized
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
  if (variant === "streetkings") {
    return <WebsiteVisual src="/images/projects/street.png" alt="StreetKings PH automotive website home page" />;
  }
  if (variant === "furniture") return (
    <WebsiteVisual
      src="/images/projects/bw.png"
      alt="B&W Customized Furnitures website home page"
      position="46% center"
    />
  );
  if (variant === "roarly") return (
    <WebsiteVisual
      src="/images/projects/roarly.png"
      alt="Roarly AI Animation Studio marketing website"
      position="42% center"
    />
  );
  return (
    <WebsiteVisual
      src="/images/projects/book.png"
      alt="BookVoice local-first audiobook studio desktop interface"
      position="48% center"
    />
  );
}
