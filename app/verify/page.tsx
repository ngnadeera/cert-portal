"use client";
import React from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import { gsap } from "gsap";
import Image from "next/image";
import description from "../lib/description";

const VerifyPage = () => {
  const [certificateId, setCertificateId] = useState("");
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);


  const CERT_ID_REGEX = /^PCRT-[A-Z]{3}-\d{2}-\d{4}$/;

  const [idError, setIdError] = useState<string>("");

   function normalizeCertId(v: string) {
    return v.trim().toUpperCase();
    }

    function isValidCertId(v: string) {
    return CERT_ID_REGEX.test(normalizeCertId(v));
    }



  
  const [step, setStep] = useState<1 | 2>(1);

 
  const shellRef = useRef<HTMLDivElement | null>(null);
  const cardRef = useRef<HTMLDivElement | null>(null);
  const step1Ref = useRef<HTMLDivElement | null>(null);
  const step2Ref = useRef<HTMLDivElement | null>(null);
  const progressDotRef = useRef<HTMLDivElement | null>(null);

  const captions = useMemo(
    () => ({
      title: "Certificate Verification",
      subtitle:
        "Verify a digital certificate using the Certificate ID. Results show holder name, product, level, issue date, expiry date, and current status.",
      step1Title: "Enter Certificate ID",
      step1Hint:
        "Use the Certificate ID printed on the certificate ",
      step2Title: "Verification Result",
      step2Hint:
        "Certificates marked Expired or Revoked are invalid for verification.",
      helpLine:
        "If you need manual verification support, contact the certification team.",
    }),
    []
  );

  async function onVerify(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setResult(null);

    const normalized = normalizeCertId(certificateId);

  if (!isValidCertId(normalized)) {
    setIdError("Invalid Certificate ID format.");
    return; 
  }




    const res = await fetch("api/verify", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ certificateId }),
    });
    


    const data = await res.json();
    setResult({ ok: res.ok, data });
    setLoading(false);

    setStep(2);
  }

  function onBack() {
    setStep(1);
  }

  function onReset() {
    setCertificateId("");
    setResult(null);
    setLoading(false);
    setStep(1);
  }

  // Initial load animation
  useEffect(() => {
    if (!shellRef.current) return;
    gsap.fromTo(
      shellRef.current,
      { opacity: 0, y: 14 },
      { opacity: 1, y: 0, duration: 0.6, ease: "power2.out" }
    );
  }, []);

  // Step transition animations
  useEffect(() => {
    const s1 = step1Ref.current;
    const s2 = step2Ref.current;
    const card = cardRef.current;
    const dot = progressDotRef.current;

    if (!s1 || !s2 || !card) return;

    gsap.killTweensOf([s1, s2, card, dot]);

    // subtle "lift" effect
    gsap.fromTo(
      card,
      { y: 0 },
      { y: -2, duration: 0.35, ease: "power2.out", yoyo: true, repeat: 1 }
    );

    if (step === 1) {
      gsap.set(s2, { display: "none", opacity: 0, y: 10 });
      gsap.set(s1, { display: "block" });

      gsap.fromTo(
        s1,
        { opacity: 0, y: 10 },
        { opacity: 1, y: 0, duration: 0.4, ease: "power2.out" }
      );

      if (dot) {
        gsap.to(dot, { y: 0, duration: 0.35, ease: "power2.out" });
      }
    } else {
      gsap.set(s1, { display: "none", opacity: 0, y: 10 });
      gsap.set(s2, { display: "block" });

      gsap.fromTo(
        s2,
        { opacity: 0, y: 10 },
        { opacity: 1, y: 0, duration: 0.4, ease: "power2.out" }
      );

      if (dot) {
        gsap.to(dot, { y: 60, duration: 0.35, ease: "power2.out" });
      }
    }
  }, [step]);

  const display = useMemo(() => {
    const data = result?.data ?? {};
    const statusRaw =
      (data.status ?? data.currentStatus ?? data.state ?? "").toString() ||
      (result?.ok ? "Active" : "Not Found");

    const status = statusRaw.toLowerCase().includes("revoke")
      ? "Revoked"
      : statusRaw.toLowerCase().includes("expire")
      ? "Expired"
      : statusRaw.toLowerCase().includes("active")
      ? "Active"
      : statusRaw;

    const holder =
      data.holderName ?? data.fullName ?? data.name ?? "— (not provided)";
    const product = data.product ?? data.productName ?? "—";
    const level = data.level ?? data.certificationLevel ?? "—";
    const issuedAt = data.issuedAt ?? data.issueDate ?? "—";
    const expiresAt = data.expiresAt ?? data.expiryDate ?? "—";
    const timeLeft =
      data.daysRemaining ?? null;
    const message = data.message ?? data.error ?? null;
    const noteTitle = description.find((d) => "Level " + d.level === data.level)?.title ?? "";
    const note = description.find((d) => "Level " + d.level === data.level)?.description ?? "";

    return { status, holder, product, level, issuedAt, expiresAt, timeLeft, message, noteTitle, note };
  }, [result]);

  const statusTone = useMemo(() => {
    const s = (display.status || "").toLowerCase();
    if (s.includes("active")) return "good";
    if (s.includes("expired")) return "warn";
    if (s.includes("revoked")) return "bad";
    if (s.includes("not")) return "bad";
    return "neutral";
  }, [display.status]);

  const statusPillClass =
    statusTone === "good"
      ? "bg-emerald-500/10 border-emerald-400/20 text-emerald-200"
      : statusTone === "warn"
      ? "bg-amber-500/10 border-amber-400/20 text-amber-200"
      : statusTone === "bad"
      ? "bg-rose-500/10 border-rose-400/20 text-rose-200"
      : "bg-slate-500/10 border-slate-400/20 text-slate-200";

  const statusDotClass =
    statusTone === "good"
      ? "bg-emerald-300"
      : statusTone === "warn"
      ? "bg-amber-300"
      : statusTone === "bad"
      ? "bg-rose-300"
      : "bg-slate-300";

  return (
    <main
      ref={shellRef}
      className="min-h-screen p-6 text-white/90 font-sans
                 bg-[radial-gradient(1000px_600px_at_18%_18%,rgba(60,120,255,0.18),transparent_60%),radial-gradient(900px_500px_at_86%_18%,rgba(0,210,255,0.12),transparent_55%),linear-gradient(180deg,#050a1b_0%,#06061a_100%)]"
    >
      {/* Top bar */}
      <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-slate-950/40 backdrop-blur px-4 py-3">
        <div className="flex items-center gap-2 select-none pl-3">
          <Image src={"/assets/Paraqum dark background logo.png"} alt="Logo" width={100} height={100} />
          <div className="pl-3">
          <span className="font-bold tracking-wide">CERT</span>
          <span className="font-semibold tracking-wide text-white/60">VERIFY</span>
          </div>
        </div>

        <button
          type="button"
          onClick={onReset}
          className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-white/90 hover:bg-white/10 active:scale-[0.99] transition"
        >
          Reset
        </button>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-[360px_1fr]">
        {/* Left rail */}
        <aside className="rounded-2xl border border-white/10 bg-slate-950/40 backdrop-blur p-5 min-h-[520px]">
          <div className="text-lg font-semibold">{captions.title}</div>
          <div className="mt-1 text-sm text-white/60 leading-relaxed">
            {captions.subtitle}
          </div>

          <div className="relative mt-6">
            <div className="absolute left-4 top-0 bottom-0 w-px bg-white/10" />
            <div
              ref={progressDotRef}
              className="absolute left-[6px] top-[18px] h-5 w-5 rounded-full opacity-50 bg-cyan-300 shadow-[0_0_20px_rgba(34,211,238,0.25)]"
            />

            <div className={`flex items-start gap-3 py-3 ${step === 1 ? "" : "opacity-70"}`}>
              <div
                className={`grid place-items-center h-8 w-8 rounded-full border ${
                  step === 1 ? "border-cyan-300/50 bg-cyan-300/10" : "border-white/10 bg-white/5"
                }`}
              >
                <span className="text-sm font-semibold">1</span>
              </div>
              <div>
                <div className="text-sm font-semibold">Enter ID</div>
                <div className="text-xs text-white/60">Type Certificate ID</div>
              </div>
            </div>

            <div className={`flex items-start gap-3 py-3 ${step === 2 ? "" : "opacity-70"}`}>
              <div
                className={`grid place-items-center h-8 w-8 rounded-full border ${
                  step === 2 ? "border-cyan-300/50 bg-cyan-300/10" : "border-white/10 bg-white/5"
                }`}
              >
                <span className="text-sm font-semibold">2</span>
              </div>
              <div>
                <div className="text-sm font-semibold">Verify</div>
                <div className="text-xs text-white/60">View status & validity</div>
              </div>
            </div>
          </div>

          <div className="mt-6 text-xs text-white/55">{captions.helpLine}</div>
        </aside>

        {/* Main content */}
        <section className="flex flex-col">
          <div
            ref={cardRef}
            className="rounded-2xl border border-white/10 bg-slate-950/40 backdrop-blur p-6 shadow-[0_14px_50px_rgba(0,0,0,0.38)]"
          >
            {/* STEP 1 */}
            <div ref={step1Ref}>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="text-xs uppercase tracking-wider text-white/50">
                    Step 1/2
                  </div>
                  <h1 className="mt-2 text-2xl font-semibold tracking-tight">
                    {captions.step1Title}
                  </h1>
                  <p className="mt-2 text-sm text-white/60 leading-relaxed">
                    {captions.step1Hint}
                  </p>
                </div>
              </div>

              <form onSubmit={onVerify} className="mt-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-white/80">
                    Certificate ID
                  </label>
                  <input
                    className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white/90 placeholder:text-white/35 outline-none focus:border-cyan-300/40 focus:ring-2 focus:ring-cyan-300/10"
                    value={certificateId}
                    onChange={(e) => {
                        const v = normalizeCertId(e.target.value);
                        setCertificateId(v);

                       
                        if (!v) {
                            setIdError("");
                        } else if (!isValidCertId(v)) {
                            setIdError("Invalid Certificate ID format. Please insert a valid ID");
                        } else {
                            setIdError("");
                        }
                        }}

                    placeholder="Enter the Certificate ID "
                    autoComplete="off"
                    spellCheck={false}
                  />

                  {idError && (
  <div className="mt-2 text-sm text-rose-300">
    {idError}
  </div>
)}


                </div>

                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                  <button 
                    className="inline-flex items-center justify-center rounded-xl bg-gradient-to-b from-blue-500 to-cyan-400 px-5 py-3 font-semibold text-slate-950 hover:opacity-95 active:scale-[0.99] transition disabled:opacity-50 disabled:cursor-not-allowed"
                    type="submit"
                    disabled={loading || !isValidCertId(certificateId)}
                    aria-busy={loading}
                  >
                    {loading ? (
                      <span className="inline-flex items-center gap-2">
                        <span className="h-4 w-4 rounded-full border-2 border-slate-950/30 border-t-slate-950 animate-spin "  />
                        Verifying…
                      </span>
                    ) : (
                      "Verify Certificate"
                    )}
                  </button>

                  <button
                    className="rounded-xl border border-white/10 bg-white/5 px-5 py-3 font-semibold text-white/90 hover:bg-white/10 active:scale-[0.99] transition disabled:opacity-50 disabled:cursor-not-allowed"
                    type="button"
                    onClick={onReset}
                    disabled={loading && step === 1}
                  >
                    Clear
                  </button>
                </div>

                <div className="flex items-start gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-xs text-white/70">
                  <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-cyan-300/80" />
                  <span>
                    Verification shows holder, product, level, issue date, expiry date, and status (Active / Expired / Revoked).
                  </span>
                </div>
              </form>
            </div>

            {/* STEP 2 */}
            <div ref={step2Ref} className="hidden">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="text-xs uppercase tracking-wider text-white/50">
                    Step 2/2
                  </div>
                  <h1 className="mt-2 text-2xl font-semibold tracking-tight">
                    {captions.step2Title}
                  </h1>
                  <p className="mt-2 text-sm text-white/60 leading-relaxed">
                    {captions.step2Hint}
                  </p>
                </div>

                <div
                  className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold ${statusPillClass}`}
                >
                  <span className={`h-2 w-2 rounded-full ${statusDotClass}`} />
                  <span>{display.status || "—"}</span>
                </div>
              </div>

              <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                  <div className="text-xs text-white/60">Certificate ID</div>
                  <div className="mt-1 font-mono text-sm text-white/90">
                                        {result
                    ? certificateId
                    : "Certificate Not Found. Please check the ID and try again."
                    } 
                  </div>
                </div>

                <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                  <div className="text-xs text-white/60">Certificate Holder</div>
                  <div className="mt-1 text-sm text-white/90">{display.holder}</div>
                </div>

                <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                  <div className="text-xs text-white/60">Product</div>
                  <div className="mt-1 text-sm text-white/90">{display.product}</div>
                </div>

                <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                  <div className="text-xs text-white/60">Certification Level</div>
                  <div className="mt-1 text-sm text-white/90">{display.level}</div>
                </div>

                <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                  <div className="text-xs text-white/60">Issue Date</div>
                  <div className="mt-1 text-sm text-white/90">{(display.issuedAt).split("T")[0]}</div>
                </div>

                <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                  <div className="text-xs text-white/60">Expiry Date</div>
                  <div className="mt-1 text-sm text-white/90">{(display.issuedAt).split("T")[0]}</div>
                </div>

                <div className="rounded-xl border border-white/10 bg-white/5 p-4 sm:col-span-2">
                  <div className="text-xs text-white/60">Validity Remaining</div>
                  <div className="mt-1 text-sm text-white/90">
                    {display.timeLeft ? display.timeLeft : "—"} days
                  </div>
                </div>
              </div>

              {display.level && (
                <div className="mt-4 rounded-xl border border-white/10 bg-white/5 p-4">
                  <div className="text-xs text-white/60 mb-2">Note</div>
                  <p>{display.level} : {display.noteTitle}</p>

                   {Array.isArray(display.note) && (display.note).map((n: string, i: number) => (
                    <p key={i} className="text-sm text-white/90 mt-1">- {n}</p>
                   ))}

                </div>
              )}

              <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
                <button
                  className="rounded-xl border border-white/10 bg-white/5 px-5 py-3 font-semibold text-white/90 hover:bg-white/10 active:scale-[0.99] transition"
                  type="button"
                  onClick={onBack}
                >
                  Back
                </button>
                <button
                  className="inline-flex items-center justify-center rounded-xl bg-gradient-to-b from-blue-500 to-cyan-400 px-5 py-3 font-semibold text-slate-950 hover:opacity-95 active:scale-[0.99] transition"
                  type="button"
                  onClick={onReset}
                >
                  Verify another
                </button>
              </div>

              {result && (
                <details className="mt-5 rounded-xl border border-white/10 bg-white/5 p-4">
                  <summary className="cursor-pointer text-sm text-white/80">
                    Show raw response
                  </summary>
                  <pre className="mt-3 overflow-auto rounded-lg bg-black/30 p-3 text-xs text-white/80">
                    {JSON.stringify(result, null, 2)}
                  </pre>
                </details>
              )}
            </div>
          </div>

          <div className="mt-3 text-xs text-white/55">
            Disclaimer: Valid only for the specified product and level. Subject to Paraqum certification terms and conditions.
          </div>
        </section>
      </div>
    </main>
  );
};

export default VerifyPage;
