type SectionHeadingProps = {
  number: string;
  title: string;
  id?: string;
};

export function SectionHeading({ number, title, id }: SectionHeadingProps) {
  return (
    <div className="section-heading">
      <span>// {number}</span>
      <h2 id={id}>{title}</h2>
      <i aria-hidden="true" />
    </div>
  );
}
