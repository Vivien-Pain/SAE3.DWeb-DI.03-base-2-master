let data = await fetch("./src/data/json/postal.json");
data = await data.json();

let Postal = {}

Postal.getAll = function() {
    return data;
}

// Fonction pour ajouter des marqueurs de zones géographiques liées aux candidats sans lycée spécifique
Postal.getPostbacMarkers = function(candidats, lycees, postal) {
    let postbacIndex = {};

    for (let cand of candidats) {
        let UAI = cand.Scolarite.find(annee => annee.UAIEtablissementorigine)?.UAIEtablissementorigine;
        let lycee = lycees.find(lycee => lycee.numero_uai === UAI);
        if (!lycee) {
            let cp = cand.Scolarite[0]?.CommuneEtablissementOrigineCodePostal;
            if (cp) {
                let villeCode = cp.slice(0, 2) + '000';
                let villeData = postal.find(ville => ville.code_postal === villeCode);
                if (villeData) {
                    postbacIndex[villeCode] = postbacIndex[villeCode] || { candidats: [], ville: villeData };
                    postbacIndex[villeCode].candidats.push(cand);
                }
            }
        }
    }

    return postbacIndex;
}

export { Postal };
