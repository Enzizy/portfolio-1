"use client";

import { ArrowUpRight, LoaderCircle } from "lucide-react";
import { type FormEvent, useState } from "react";

type SubmitState = {
  status: "idle" | "sending" | "success" | "error";
  message: string;
  fallbackHref?: string;
};

const initialState: SubmitState = { status: "idle", message: "" };

export function ContactForm() {
  const [submitState, setSubmitState] = useState(initialState);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    setSubmitState({ status: "sending", message: "Sending your message…" });

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(Object.fromEntries(formData)),
      });
      const result = (await response.json()) as { message?: string };

      if (!response.ok) {
        if (response.status === 502 || response.status === 503) {
          const name = String(formData.get("name") ?? "");
          const projectType = String(formData.get("projectType") ?? "Project inquiry");
          const message = String(formData.get("message") ?? "");
          const email = String(formData.get("email") ?? "");
          const fallbackHref = `mailto:zhyronnebatican@gmail.com?subject=${encodeURIComponent(
            `Portfolio inquiry: ${projectType}`,
          )}&body=${encodeURIComponent(`${message}\n\nFrom: ${name} (${email})`)}`;
          setSubmitState({
            status: "error",
            message: `${result.message ?? "Online delivery is unavailable"} You can open the same message in your email app.`,
            fallbackHref,
          });
          return;
        }
        throw new Error(result.message ?? "The message could not be sent.");
      }

      form.reset();
      setSubmitState({
        status: "success",
        message: "Thanks—your message is on its way. I’ll get back to you soon.",
      });
    } catch (error) {
      setSubmitState({
        status: "error",
        message: error instanceof Error ? error.message : "The message could not be sent.",
      });
    }
  };

  return (
    <form className="contact-form" onSubmit={handleSubmit} aria-describedby="contact-form-status">
      <div className="contact-form__row">
        <label>
          <span>Name</span>
          <input name="name" type="text" autoComplete="name" minLength={2} maxLength={80} required />
        </label>
        <label>
          <span>Email</span>
          <input name="email" type="email" autoComplete="email" maxLength={160} required />
        </label>
      </div>
      <label>
        <span>Project type</span>
        <select name="projectType" defaultValue="" required>
          <option value="" disabled>Select a project</option>
          <option>Web application</option>
          <option>AI solution</option>
          <option>Mobile application</option>
          <option>Business website</option>
          <option>UI/UX design</option>
          <option>Something else</option>
        </select>
      </label>
      <label>
        <span>Tell me about the project</span>
        <textarea name="message" rows={4} minLength={20} maxLength={3000} required />
      </label>
      <label className="contact-form__honeypot" aria-hidden="true">
        Company website
        <input name="company" type="text" tabIndex={-1} autoComplete="off" />
      </label>
      <div className="contact-form__footer">
        <button
          className="button button--dark"
          type="submit"
          disabled={submitState.status === "sending"}
          data-cat-perch
          data-cat-zone="contact"
          data-cat-kind="button"
        >
          {submitState.status === "sending" ? (
            <>Sending <LoaderCircle className="contact-form__spinner" size={15} /></>
          ) : (
            <>Send message <ArrowUpRight size={15} /></>
          )}
        </button>
        <p
          id="contact-form-status"
          className={`contact-form__status contact-form__status--${submitState.status}`}
          role="status"
          aria-live="polite"
        >
          {submitState.message}
          {submitState.fallbackHref && (
            <> <a href={submitState.fallbackHref}>Open email instead</a>.</>
          )}
        </p>
      </div>
    </form>
  );
}
