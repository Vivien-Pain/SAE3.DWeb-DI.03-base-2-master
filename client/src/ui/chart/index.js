import anychart from 'anychart/dist/js/anychart-bundle.min.js';

let ChartComponent = {
    chart: null,

    init(candidats) {
        let data = this.prepareData(candidats);
        this.renderChart(data);
    },

    prepareData(candidats) {
        let departments = {};

        candidats.forEach((cand) => {
            // Vérifie si `Scolarite` existe et contient des données valides
            if (cand.Scolarite && cand.Scolarite.length > 0) {
                let cp = cand.Scolarite[0]?.CommuneEtablissementOrigineCodePostal; // Code postal
                if (cp) {
                    let dep = cp.slice(0, 2); // Département
                    if (!departments[dep]) {
                        departments[dep] = { postbac: 0, general: 0, sti2d: 0, autres: 0 };
                    }

                    // Catégorisation des candidatures
                    switch (cand.Baccalaureat?.SerieDiplomeCode) {
                        case 'Générale':
                            departments[dep].general++;
                            break;
                        case 'STI2D':
                            departments[dep].sti2d++;
                            break;
                        default:
                            departments[dep].autres++;
                            break;
                    }
                } else {
                    console.warn('Code postal manquant pour le candidat :', cand);
                }
            } else {
                console.warn('Scolarité manquante pour le candidat :', cand);
            }
        });

        return departments;
    },

    renderChart(data) {
        // Créer les données pour le graphique
        let chartData = [];
        for (let dep in data) {
            chartData.push([
                dep,
                data[dep].postbac,
                data[dep].general,
                data[dep].sti2d,
                data[dep].autres
            ]);
        }
    
        // Initialisation du graphique
        this.chart = anychart.bar();
    
        // Ajouter des séries manuellement
        let postbacSeries = this.chart.bar(chartData.map(row => ({ x: row[0], value: row[1] })));
        let generalSeries = this.chart.bar(chartData.map(row => ({ x: row[0], value: row[2] })));
        let sti2dSeries = this.chart.bar(chartData.map(row => ({ x: row[0], value: row[3] })));
        let autresSeries = this.chart.bar(chartData.map(row => ({ x: row[0], value: row[4] })));
    
        // Configurer les séries
        postbacSeries.name("Post-bac");
        generalSeries.name("Générale");
        sti2dSeries.name("STI2D");
        autresSeries.name("Autres");
    
        // Activer les étiquettes pour chaque série
        postbacSeries.labels(true);
        generalSeries.labels(true);
        sti2dSeries.labels(true);
        autresSeries.labels(true);
    
        // Personnalisation
        this.chart.title("Candidatures par Département");
        this.chart.container("chart-container");
        this.chart.draw();
    }
};
export { ChartComponent };
