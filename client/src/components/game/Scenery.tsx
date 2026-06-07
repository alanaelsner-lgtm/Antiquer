import bgFlea from "@/assets/saturday-bg.png.asset.json";
import bgShop from "@/assets/saturday-shop.png.asset.json";

/** Saturday-morning cartoon backdrop for the flea market. */
export function FleaMarketBackdrop() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 -z-0 overflow-hidden">
      <img
        src={bgFlea.url}
        alt=""
        width={1536}
        height={1024}
        className="absolute inset-0 h-full w-full object-cover"
      />
    </div>
  );
}

/** Saturday-morning cartoon backdrop for the antique shop interior. */
export function ShopBackdrop() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 -z-0 overflow-hidden">
      <img
        src={bgShop.url}
        alt=""
        width={1536}
        height={1024}
        className="absolute inset-0 h-full w-full object-cover"
      />
    </div>
  );
}