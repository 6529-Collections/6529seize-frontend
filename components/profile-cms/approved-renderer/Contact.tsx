"use client";

import { Suspense, useState, type FormEvent } from "react";
import { useSearchParams } from "next/navigation";

import { t } from "@/i18n/messages";
import type { CmsBlockV1 } from "@/lib/profile-cms/protocol/v1";
import { getString } from "../site-renderer/data";
import type { RendererContext } from "../site-renderer/types";
import { record } from "./contract";
import { useApprovedSession, type ApprovedContactDraft } from "./session";
import styles from "./approved.module.css";

function safeEmail(value: string) {
  return (
    /^[A-Za-z0-9.!#$%&'*+/=?^_`{|}~-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/.test(
      value
    ) && !/[\r\n]/.test(value)
  );
}

interface ContactProps {
  readonly block: CmsBlockV1;
  readonly context: RendererContext;
}

export default function ApprovedContact(props: ContactProps) {
  return (
    <Suspense fallback={<ContactForm {...props} />}>
      <ContactWithSubject {...props} />
    </Suspense>
  );
}

function ContactWithSubject(props: ContactProps) {
  const search = useSearchParams();
  return (
    <ContactForm
      {...props}
      querySubject={search.get("subject")?.slice(0, 200)}
    />
  );
}

function ContactForm({
  block,
  context,
  querySubject,
}: ContactProps & {
  readonly querySubject?: string | undefined;
}) {
  const session = useApprovedSession();
  const [localDraft, setLocalDraft] = useState<ApprovedContactDraft>({});
  const draft = session?.drafts[block.id] ?? localDraft;
  const update = (patch: ApprovedContactDraft) => {
    if (session) session.updateDraft(block.id, patch);
    else setLocalDraft((value) => ({ ...value, ...patch }));
  };
  const email = getString(block, "email") ?? "";
  const subject =
    draft.subject ??
    session?.subject ??
    querySubject ??
    getString(block, "subject") ??
    "";
  const name = draft.name ?? "";
  const replyTo = draft.replyTo ?? "";
  const message = draft.message ?? "";
  const [prepared, setPrepared] = useState(false);
  const validRecipient = safeEmail(email);
  const body = [message, "", name, replyTo].join("\n");
  const href = `mailto:${encodeURIComponent(email)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  const prepare = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (validRecipient && event.currentTarget.reportValidity())
      setPrepared(true);
  };
  const title = getString(block, "title");
  const content = getString(block, "content");
  return (
    <section className={styles["contact"]}>
      <div>
        {title ? <h2>{title}</h2> : null}
        {content ? <p>{content}</p> : null}
        <ContactAddress email={email} valid={validRecipient} />
      </div>
      {record(block)["form"] === true && validRecipient ? (
        <form
          onSubmit={prepare}
          className={styles["contactForm"]}
          onChange={() => setPrepared(false)}
        >
          <label>
            <span>{t(context.locale, "profileCms.approved.contactName")}</span>
            <input
              autoComplete="name"
              value={name}
              onChange={(event) => update({ name: event.target.value })}
              required
              maxLength={120}
            />
          </label>
          <label>
            <span>{t(context.locale, "profileCms.approved.contactEmail")}</span>
            <input
              type="email"
              autoComplete="email"
              value={replyTo}
              onChange={(event) => update({ replyTo: event.target.value })}
              required
              maxLength={254}
            />
          </label>
          <label className={styles["formWide"]}>
            <span>
              {t(context.locale, "profileCms.approved.contactSubject")}
            </span>
            <input
              value={subject}
              onChange={(event) => update({ subject: event.target.value })}
              required
              maxLength={200}
            />
          </label>
          <label className={styles["formWide"]}>
            <span>
              {t(context.locale, "profileCms.approved.contactMessage")}
            </span>
            <textarea
              value={message}
              onChange={(event) => update({ message: event.target.value })}
              required
              rows={5}
              maxLength={4000}
            />
          </label>
          <p className={styles["formWide"]}>
            {t(context.locale, "profileCms.approved.contactHint")}
          </p>
          <button type="submit" className={styles["action"]}>
            {t(context.locale, "profileCms.approved.prepareEmail")}
          </button>
          {prepared ? (
            <div className={styles["formWide"]} role="status">
              <p>{t(context.locale, "profileCms.approved.emailReady")}</p>
              <a href={href} className={styles["textLink"]}>
                {t(context.locale, "profileCms.approved.openEmail")}{" "}
                <span aria-hidden="true">↗</span>
              </a>
            </div>
          ) : null}
        </form>
      ) : null}
    </section>
  );
}

function ContactAddress({
  email,
  valid,
}: {
  readonly email: string;
  readonly valid: boolean;
}) {
  if (!email) return null;
  if (!valid) return <p>{email}</p>;
  return (
    <a
      className={styles["contactAddress"]}
      href={`mailto:${encodeURIComponent(email)}`}
    >
      {email}
    </a>
  );
}
