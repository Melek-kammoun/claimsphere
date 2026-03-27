import { Link } from "react-router-dom";

const offers = [
  { id: "securite", title: "Sécurité", description: "Protection de base pour votre véhicule." },
  { id: "securite_plus", title: "Sécurité +", description: "Couverture élargie avec assistance route premium." },
  { id: "serenite", title: "Sérénité", description: "Pack complet avec prise en charge sinistre et assurance tous risques." },
  { id: "super_securite", title: "Super Sécurité", description: "Protection maximale + services premium 24/7." },
];

const OffersPage = () => (
  <div className="min-h-screen bg-background p-6">
    <div className="mx-auto max-w-5xl">
      <h1 className="text-3xl font-bold mb-4">Offres disponibles</h1>
      <p className="text-sm text-muted-foreground mb-6">Choisissez l’offre qui correspond le mieux à votre besoin. Je te préparerai tous les détails ensuite.</p>

      <div className="grid gap-4 md:grid-cols-2">
        {offers.map((offer) => (
          <div key={offer.id} className="rounded-xl border p-5 bg-white shadow-sm">
            <h2 className="text-xl font-semibold mb-2">{offer.title}</h2>
            <p className="text-sm text-gray-600 mb-4">{offer.description}</p>
            <Link
              to={`/dashboard/offers/${offer.id}`}
              className="inline-flex items-center gap-2 rounded-md bg-primary px-3 py-2 text-sm font-medium text-white hover:bg-primary/90"
            >
              Voir détails
            </Link>
          </div>
        ))}
      </div>
    </div>
  </div>
);

export default OffersPage;
