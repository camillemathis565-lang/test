"""Impact of cross-border flows on independent shops (SMEs) vs chains.

    python run_business_impact.py     # after run_pipeline.py (reuses its caches)
"""
import numpy as np
import pandas as pd

from cbattr import business, prices, population
from cbattr import config as C
from run_pipeline import build_inputs


def main():
    I = build_inputs()
    dest, cells, T, shops = I["dest"], I["cells"], I["T"], I["shops"]
    pli, spend, _ = prices.price_and_spend()
    names = population.nuts_names()

    print("impact: actual vs closed borders")
    t = business.impact(dest, cells, T, pli, spend, shops)

    # OSM brand tagging completeness, by country (bias check)
    own = t[t.segment == "everyday"].pivot_table(index="country", columns="ownership",
                                                 values="n_shops", aggfunc="sum")
    own["chain_share_of_shops"] = own.chain / own.sum(axis=1)

    by_type = business.summarise(t, ["country", "type", "ownership"])
    by_country = business.summarise(t, ["country", "ownership"])
    by_seg = business.summarise(t[t.country == "FR"], ["segment", "type", "ownership"])
    fr_nuts = business.summarise(t[t.country == "FR"], ["nuts3", "ownership"])
    fr_nuts["name"] = fr_nuts.nuts3.map(names)
    per_dest = business.summarise(t, ["dest", "name", "type", "country", "nuts3", "ownership"])

    # sensitivity: France, net by ownership under weaker/stronger border friction
    sens = []
    for scale in C.SENSITIVITY_THETA_SCALE:
        from cbattr import huff
        a = huff.run(dest, cells, T, pli, spend, theta_scale=scale)
        c = huff.run(dest, cells, T, pli, spend, theta_scale=0.0)
        fc = np.asarray(cells.country, dtype=object)
        dc = np.asarray(dest.country, dtype=object)
        fmask = dc == "FR"
        for_ = fc[None, :] != dc[:, None]
        cs = business.ownership_split(dest, shops).set_index("dest").reindex(dest.dest)
        for owner in ("chain", "independent"):
            net = base = 0.0
            for seg in C.SEGMENTS:
                sh = cs[f"chain_share_{seg}"].values
                sh = sh if owner == "chain" else 1 - sh
                gain = (a[seg] * for_).sum(axis=1)
                loss = (a[seg] * ~for_).sum(axis=1) - c[seg].sum(axis=1)
                net += ((gain + loss) * sh)[fmask].sum()
                base += (c[seg].sum(axis=1) * sh)[fmask].sum()
            sens.append({"theta_scale": scale, "ownership": owner, "net_eur": net,
                         "net_pct": net / base})
    sens = pd.DataFrame(sens)

    ff = "%.5g"
    per_dest.to_csv(C.OUT / "business_impact_destinations.csv", index=False, float_format=ff)
    by_type.to_csv(C.OUT / "business_impact_by_country_type.csv", index=False, float_format=ff)
    fr_nuts.to_csv(C.OUT / "business_impact_france_nuts3.csv", index=False, float_format=ff)
    sens.to_csv(C.OUT / "business_impact_sensitivity.csv", index=False, float_format=ff)

    pd.set_option("display.width", 200)
    m = lambda df, cols: df.assign(**{c: (df[c] / 1e6).round(1) for c in cols})
    money = ["turnover_closed", "gain_foreign", "loss_domestic", "net"]
    print("\nChain share of shops (OSM brand tags):\n", own.round(3))
    print("\nBy country x ownership (EUR M/yr):\n", m(by_country, money).round(3).to_string(index=False))
    print("\nFrance by segment x type x ownership:\n", m(by_seg, money).round(3).to_string(index=False))
    print("\nFrance by type x ownership:\n",
          m(by_type[by_type.country == "FR"], money).round(3).to_string(index=False))
    print("\nSensitivity (France):\n", sens.assign(net_eur=(sens.net_eur / 1e6).round(0)).round(3))


if __name__ == "__main__":
    main()
