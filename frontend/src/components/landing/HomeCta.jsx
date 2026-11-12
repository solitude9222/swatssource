import { useState } from "react";
import { ArrowRight } from "lucide-react";
import { BoltField } from "./Bolts";

/* The closing banner: the hero's navy, its bolts, and one last claim field.
   The button stays dim until a name is typed, so a click never fires an empty
   registration. */
export const HomeCta = () => {
  const [alias, setAlias] = useState("");
  const name = alias.replace(/\s/g, "").toLowerCase();

  return (
    <section data-testid="home-cta" className="px-4 pb-24 pt-8">
      <div
        className="relative mx-auto max-w-[1150px] overflow-hidden rounded-[32px] border border-[#1f1f1f] px-6 py-16 text-center sm:px-10"
        style={{ background: "linear-gradient(180deg, #111f4a 0%, #0e1838 100%)" }}
      >
        <BoltField rows={6} cols={10} color="rgba(30,45,101,0.9)" cellW={230} cellH={130} />

        <div className="relative z-10 mx-auto max-w-[560px]">
          <h2 className="font-display text-[34px] font-extrabold leading-tight tracking-tight text-white sm:text-[40px]">
            Everything you need, right here.
          </h2>
          <p className="mx-auto mt-3 max-w-[460px] text-[15px] leading-relaxed text-[#9fa2af]">
            Create your profile, connect your links, and keep your audience in one clean place.
          </p>

          <form
            className="mx-auto mt-8 flex max-w-[520px] flex-col gap-2.5 sm:flex-row"
            onSubmit={(e) => {
              e.preventDefault();
              if (name) window.location.assign(`/!/register?claim=${encodeURIComponent(name)}`);
            }}
          >
            <label className="flex h-[50px] flex-1 items-center rounded-[10px] border border-[#1f1f1f] bg-[#0b0c0f] px-4">
              <span className="font-mono2 text-[13px] text-[#5e7191]">tourn.lol/</span>
              <input
                data-testid="cta-claim-input"
                value={alias}
                onChange={(e) => setAlias(e.target.value.replace(/\s/g, ""))}
                placeholder="username"
                className="min-w-0 flex-1 bg-transparent px-1 text-[13px] text-white outline-none placeholder:text-[#4c5568]"
              />
            </label>
            <button
              type="submit"
              data-testid="cta-claim-btn"
              disabled={!name}
              className={`inline-flex h-[50px] items-center justify-center gap-2 rounded-[10px] px-6 text-[13px] font-bold text-white transition-colors ${
                name ? "bg-[#3965e6] hover:bg-[#4a73ee]" : "bg-[#264297] hover:bg-[#264297]"
              }`}
            >
              Claim link
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </form>
        </div>
      </div>
    </section>
  );
};

export default HomeCta;
