"use client";

// The tertiary layer: where the text comes from, how the marks are encoded, and
// the research behind the method. Quiet on purpose: it is here for the curious.

interface Ref {
  id?: string;
  cite: string;
  finding: string;
  href: string;
}

const RESEARCH: Ref[] = [
  {
    id: "src-recall",
    cite: "Roediger & Karpicke, 2006. Psychological Science",
    finding: "A week after studying a text, recalling it three times kept 61%; rereading it three times kept 40%.",
    href: "https://doi.org/10.1111/j.1467-9280.2006.01693.x",
  },
  {
    cite: "Karpicke & Blunt, 2011. Science",
    finding: "Practising recall beat building concept maps for learning a text.",
    href: "https://doi.org/10.1126/science.1199327",
  },
  {
    id: "src-fading",
    cite: "Finley, Benjamin, Hays, Bjork & Kornell, 2011. Journal of Memory and Language",
    finding: "Removing cues bit by bit across practice gave the best final recall.",
    href: "https://doi.org/10.1016/j.jml.2011.01.006",
  },
  {
    cite: "Fiechter & Benjamin, 2018. Psychonomic Bulletin & Review",
    finding: "Fading cues helped even where plain testing did not.",
    href: "https://doi.org/10.3758/s13423-017-1366-9",
  },
  {
    id: "src-spacing",
    cite: "Cepeda, Pashler, Vul, Wixted & Rohrer, 2006. Psychological Bulletin",
    finding: "Across hundreds of comparisons, spaced study beat massed study (47% vs 37% recalled).",
    href: "https://doi.org/10.1037/0033-2909.132.3.354",
  },
  {
    cite: "Cepeda, Vul, Rohrer, Wixted & Pashler, 2008. Psychological Science",
    finding: "The best gap between reviews grows with how long you want to remember.",
    href: "https://doi.org/10.1111/j.1467-9280.2008.02209.x",
  },
  {
    id: "src-sleep",
    cite: "Diekelmann & Born, 2010. Nature Reviews Neuroscience",
    finding: "Sleep replays and strengthens newly learned words and facts.",
    href: "https://doi.org/10.1038/nrn2762",
  },
  {
    cite: "Mazza et al., 2016. Psychological Science",
    finding: "Sleeping between two study sessions halved the relearning needed and helped recall six months on.",
    href: "https://doi.org/10.1177/0956797616659930",
  },
  {
    id: "src-melody",
    cite: "Wallace, 1994. JEP: Learning, Memory, and Cognition",
    finding: "One simple melody repeated across verses helped word-for-word recall of text.",
    href: "https://doi.org/10.1037/0278-7393.20.6.1471",
  },
  {
    id: "src-gesture",
    cite: "Baills, Suárez-González, González-Fuente & Prieto, 2019. Studies in Second Language Acquisition",
    finding: "Hand gestures that trace pitch helped 106 learners perceive tones and learn words.",
    href: "https://doi.org/10.1017/S0272263118000074",
  },
  {
    cite: "Roberts, MacLeod & Fernandes, 2022. Psychological Bulletin",
    finding: "Acting a phrase out beats reading it (enactment effect, 145 studies).",
    href: "https://doi.org/10.1037/bul0000360",
  },
  {
    id: "src-chunks",
    cite: "Cowan, 2001. Behavioral and Brain Sciences",
    finding: "Working memory holds about four chunks at once.",
    href: "https://doi.org/10.1017/S0140525X01003922",
  },
  {
    id: "src-generation",
    cite: "Slamecka & Graf, 1978. JEP: Human Learning and Memory",
    finding: "Words you produce yourself are remembered better than words you read.",
    href: "https://doi.org/10.1037/0278-7393.4.6.592",
  },
  {
    id: "src-loci",
    cite: "Dresler et al., 2017. Neuron",
    finding: "Six weeks of method-of-loci training gave novices large, lasting gains in recall.",
    href: "https://doi.org/10.1016/j.neuron.2017.02.003",
  },
  {
    cite: "Maguire, Valentine, Wilding & Kapur, 2003. Nature Neuroscience",
    finding: "Memory champions did not have unusual brains; nine in ten used a spatial route.",
    href: "https://doi.org/10.1038/nn988",
  },
  {
    cite: "Bower & Clark, 1969. Psychonomic Science",
    finding: "Linking a word list into a story improved later recall several times over.",
    href: "https://doi.org/10.3758/BF03332778",
  },
  {
    cite: "Hartzell et al., 2016. NeuroImage",
    finding: "Yajurveda pandits, who mark the accents with hand gestures, showed more grey matter in memory regions. A comparison, not proof of cause.",
    href: "https://doi.org/10.1016/j.neuroimage.2015.07.027",
  },
];

const PATHAS: [string, string, string][] = [
  ["Saṃhitā", "the text as chanted", "A B C D"],
  ["Pada", "word by word", "A · B · C · D"],
  ["Krama", "overlapping pairs", "AB  BC  CD"],
  ["Jaṭā", "braided pairs", "AB BA AB   BC CB BC"],
  ["Ghana", "braided triples", "AB BA ABC CBA ABC"],
];

export default function Sources() {
  return (
    <section id="sources" className="ck-sec ck-sources" aria-labelledby="ck-sources-title">
      <div className="ck-wrap">
        <h2 id="ck-sources-title" className="ck-h2">
          Down the rabbit hole
        </h2>

        <div className="ck-sources__grid">
          <div className="ck-sources__col">
            <h3 className="ck-h3">The text</h3>
            <p className="ck-p">
              Chamakam, Taittirīya Saṃhitā 4.7.1 to 4.7.11, with its opening verse and closing śānti.
              Transcribed from the Script & Roman Coloured Coding Script edition (saiveda.net), pages 26
              to 41, and checked mark by mark against two independent Unicode texts:{" "}
              <a href="https://sanskritdocuments.org/doc_veda/chamaka.html">sanskritdocuments.org</a>{" "}
              (with its accented Taittirīya Saṃhitā) and{" "}
              <a href="https://github.com/stotrasamhita/vedamantra-book">stotrasamhita/vedamantra-book</a>.
              Where the sources differ only in spelling, this page follows the PDF. The short glosses are
              study aids written for this page, not translations.
            </p>

            <h3 className="ck-h3">The marks</h3>
            <p className="ck-p">
              In Taittirīya texts <span className="ck-mark ck-flame">◌॑</span> (U+0951) marks the svarita and
              the udātta is left unmarked. <span className="ck-mark ck-water">◌॒</span> (U+0952) is the
              anudātta, <span className="ck-mark ck-ember">◌᳚</span> (U+1CDA) the held svarita.{" "}
              <span className="ck-deva">ꣳ</span> and <span className="ck-deva">ꣴ</span> (U+A8F3, U+A8F4)
              are the nasal chanted roughly as “gm”; the IAST view writes them that way.
            </p>

            <h3 className="ck-h3">The tone guide</h3>
            <p className="ck-p">
              Each syllable is a plain piano note, C for a dip, D for level, E for a lift, stopped dead
              before the next; a held lift stays on E, then drops to D. Long vowels last twice as long. It
              shows where the pitch goes, not how a teacher sounds: learn the voice from a teacher or a
              good recording, and use this page to fix the words and the shape.
            </p>

            <h3 className="ck-h3" id="src-patha">
              The oldest memory protocol
            </h3>
            <p className="ck-p">
              Vedic schools drill one text in several orders so that any slip shows up, much like a checksum.
              Krama, the Links drill above, is the simplest. The orders are described by{" "}
              <a href="https://doi.org/10.1007/1-4020-2321-9_7">Filliozat (2004)</a>; the tradition as a whole
              was inscribed by{" "}
              <a href="https://ich.unesco.org/en/RL/tradition-of-vedic-chanting-00062">UNESCO</a> in 2008.
            </p>
            <table className="ck-pathas">
              <tbody>
                {PATHAS.map(([name, what, shape]) => (
                  <tr key={name}>
                    <th scope="row">{name}</th>
                    <td className="ck-read">{what}</td>
                    <td className="ck-pathas__shape">{shape}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="ck-sources__col">
            <h3 className="ck-h3">The research</h3>
            <ol className="ck-refs">
              {RESEARCH.map((r) => (
                <li key={r.href} id={r.id}>
                  <a href={r.href} target="_blank" rel="noopener noreferrer">
                    {r.cite}
                  </a>
                  <span>{r.finding}</span>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </div>
    </section>
  );
}
