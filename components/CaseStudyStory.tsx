export type CaseStudyStoryDetails = {
  challenge: string;
  decisions: string;
  result: string;
};

export function CaseStudyStory({ id, story }: { id: string; story: CaseStudyStoryDetails }) {
  const chapters = [
    { number: "01", title: "The challenge", copy: story.challenge },
    { number: "02", title: "The approach", copy: story.decisions },
    { number: "03", title: "What it delivers", copy: story.result },
  ];

  return (
    <section className="case-study__story" aria-labelledby={id}>
      <div className="case-study__story-heading">
        <span>// 01 / THE STORY</span>
        <h2 id={id}>Why this was built.</h2>
      </div>
      <div className="case-study__story-grid">
        {chapters.map(({ number, title, copy }) => (
          <article key={number}>
            <span>{number}</span>
            <h3>{title}</h3>
            <p>{copy}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
