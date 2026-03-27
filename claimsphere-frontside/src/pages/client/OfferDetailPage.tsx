import { useParams, Link } from "react-router-dom";

const offersDetail = {
  super_securite: {
    title: "Super Sécurité",
    tagline: "Destinée aux voitures de moins de 10 ans, ce pack fait toute la différence.",
    intro:
      "Retrouve toutes les options du pack Sécurité, mais protège ton véhicule quasiment neuf tout en conservant la couverture de base de l'assurance auto classique.",
    garanties: [
      "Défense et Recours (CAS)",
      "Responsabilité civile",
      "Incendie",
      "Vol",
      "Accident corporel du conducteur",
      "Événements climatiques",
      "Grèves, émeutes et mouvements populaires",
      "Personnes Transportées (PTA)",
      "Bris de glace",
      "Dommages Collision",
      "Assistance Gold",
    ],
    optionnelles: ["Vol autoradio"],
    details: {
      cas: "Cette garantie juridique couvre les frais de procédure et la défense de l'assuré en cas de litige avec un tiers.",
      responsabilite:
        "Couvre les dommages corporels, matériels et immatériels causés à autrui, y compris vos passagers, si vous êtes responsable.",
      incendie:
        "Indemnise les dommages dus à incendie ou explosion subis par votre véhicule.",
      vol:
        "Couvre les dommages suite au vol ou tentative de vol et rembourse les frais de récupération.",
      conducteur:
        "Indemnise vos frais médicaux, d'hospitalisation et dommages/ intérêts en cas de blessure pendant la conduite.",
      climatiques:
        "Répare/remplace le véhicule endommagé par catastrophes naturelles.",
      greve:
        "Couvre dommages matériels et immatériels liés aux grèves, émeutes et mouvements populaires.",
      pta:
        "Protège le conducteur et les passagers en cas de dommages corporels, invalidité ou décès, avec prise en charge des frais médicaux.",
      bris:
        "Couvre bris de vitre du véhicule (circulant ou non) et frais de pose.",
      collision:
        "Couvre collisions avec autres véhicules, charrettes, cyclomoteurs, bicyclettes, selon capital choisi.",
      assistance:
        "Dépannage, remorquage et prise en charge des personnes transportées en cas d'accident/panne.",
      volAutoradio:
        "Couvre le vol de l'autoradio après effraction.",
    },
  },
  securite_plus: {
    title: "Sécurité+",
    tagline: "Conçu pour les voitures d'occasion avec réparations intégrales.",
    intro:
      "Combine les avantages du pack Sécurité et les besoins d'une voiture d'occasion pour une couverture complète.",
    garanties: [
      "Défense et Recours (CAS)",
      "Responsabilité civile",
      "Incendie",
      "Vol",
      "Accident corporel du conducteur",
      "Événements climatiques",
      "Dommages Collision",
      "Personnes Transportées (PTA)",
      "Bris de glace",
      "Assistance Gold",
    ],
    optionnelles: ["Vol autoradio", "Grèves, émeutes et mouvements populaires"],
    details: {
      cas: "Comme pour Super Sécurité, frais judiciaires et défense en litige tiers.",
      responsabilite:
        "Responsabilité des dommages causés à autrui et aux passagers.",
      incendie:
        "Indemnisation incendie/explosion.",
      vol:
        "Indemnisation vol/tentative de vol.",
      conducteur:
        "Prise en charge des frais médicaux pour le conducteur blessé.",
      climatiques:
        "Couverture dégâts climatiques.",
      collision:
        "Protection collisions toutes responsabilités.",
      pta:
        "Protection conducteur et passagers (dommages, invalidité, décès).",
      bris:
        "Couvre toutes les vitres et pose.",
      assistance:
        "Dépannage remorquage et transport des personnes.",
      volAutoradio:
        "Couvre le vol d'autoradio après effraction.",
      greve:
        "Couvre les dégâts causés par grèves, émeutes, etc.",
    },
  },
  securite: {
    title: "Sécurité",
    tagline: "Pack basique pour assurer votre voiture et vous protéger sur la route.",
    intro:
      "Budget réduit, couvre l'essentiel (protection civile + options clés : conducteur, défense, vol, incendie, PTA, assistance, bris de glace).",
    garanties: [
      "Responsabilité civile",
      "Défense et Recours (CAS)",
      "Incendie",
      "Vol",
      "Accident corporel du conducteur",
      "Personnes Transportées (PTA)",
      "Assistance Gold",
      "Bris de glace",
    ],
    optionnelles: [],
    details: {
      responsabilite:
        "Couvre dommages corporels, matériels et immatériels causés à autrui.",
      cas: "Frais judiciaire et défense en cas de litige.",
      incendie:
        "Indemnisation incendie/explosion.",
      vol:
        "Couvre vol/tentative de vol.",
      conducteur:
        "Indemnisation en cas de blessure du conducteur pour frais médicaux.",
      pta:
        "Couvre les passagers pour dommages corporels, invalidité, décès, frais médicaux.",
      assistance:
        "Dépannage/panne/remorquage et prise en charge des personnes.",
      bris:
        "Couvre bris de glace et frais de pose.",
    },
  },
  serenite: {
    title: "Sérénité",
    tagline: "Conduisez serein, avec une couverture adaptée et une ristourne non sinistre.",
    intro:
      "Idéal pour une tranquillité au quotidien ; en cas de non sinistre, bonification de 15 % à la reconduction.",
    garanties: [
      "Incendie",
      "Vol",
      "Accident corporel du conducteur",
      "Événements climatiques",
      "Responsabilité civile",
      "Défense et Recours (CAS)",
      "Dommages Tierce",
      "Personnes Transportées (PTA)",
      "Bris de glace",
      "Grèves, émeutes et mouvements populaires",
    ],
    optionnelles: ["Vol autoradio"],
    details: {
      incendie:
        "Couvre les dommages liés à incendie/explosion.",
      vol:
        "Protection vol et tentative de vol.",
      conducteur:
        "Indemnisation conducteur blessé.",
      climatiques:
        "Couvre dégâts causés par catastrophes naturelles.",
      responsabilite:
        "Couvre dommages causés à autrui.",
      cas:
        "Frais de défense juridique.",
      dommagesTierce:
        "Couvre réparations collision non responsabilité.",
      pta:
        "Couvre passagers pour invalidité, décès et frais médicaux.",
      bris:
        "Couvre bris de glace et pose.",
      greve:
        "Couvre dommages en cas de grèves, émeutes.",
      volAutoradio:
        "Couvre le vol d'autoradio.",
    },
  },
};

const normalizeId = (rawId?: string) => {
  if (!rawId) return "";
  return rawId
    .trim()
    .toLowerCase()
    .replace(/[\s\-]+/g, "_")
    .replace(/[^a-z0-9_]/g, "");
};

const OfferDetailPage = () => {
  const { id } = useParams();
  const normalizedId = normalizeId(id);
  const offer = normalizedId ? offersDetail[normalizedId as keyof typeof offersDetail] : null;

  if (!offer) {
    return (
      <div className="min-h-screen p-6">
        <h1 className="text-2xl font-bold">Offre introuvable</h1>
        <p className="mt-3">Reviens à la page des offres pour choisir un pack valide.</p>
        <Link to="/dashboard/offers" className="mt-4 inline-block rounded bg-primary px-4 py-2 text-white">
          Retour aux offres
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="mx-auto max-w-4xl">
        <Link to="/dashboard/offers" className="text-sm text-primary hover:underline">
          ← Retour aux offres
        </Link>

        <h1 className="mt-2 text-3xl font-bold">{offer.title}</h1>
        <p className="mt-2 text-muted-foreground">{offer.tagline}</p>
        <p className="mt-4 text-gray-700">{offer.intro}</p>

        <div className="mt-6">
          <h2 className="text-2xl font-semibold">Vos garanties</h2>
          <ul className="mt-3 list-disc space-y-2 pl-5 text-gray-700">
            {offer.garanties.map((g) => (
              <li key={g}>{g}</li>
            ))}
          </ul>
        </div>

        {offer.optionnelles.length > 0 && (
          <div className="mt-6">
            <h2 className="text-2xl font-semibold">Vos garanties optionnelles</h2>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-gray-700">
              {offer.optionnelles.map((o) => (
                <li key={o}>{o}</li>
              ))}
            </ul>
          </div>
        )}

        <div className="mt-6">
          <h2 className="text-2xl font-semibold">Détails</h2>
          <div className="mt-3 space-y-3 text-gray-700">
            {Object.entries(offer.details).map(([label, detail]) => (
              <div key={label}>
                <p className="font-semibold capitalize">{label.replace(/_/g, " ")}</p>
                <p>{detail}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default OfferDetailPage;
