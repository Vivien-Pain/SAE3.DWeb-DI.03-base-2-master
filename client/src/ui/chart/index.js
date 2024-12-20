import anychart from 'anychart/dist/js/anychart-bundle.min.js';

let ChartComponent = {
    chart: null,
    threshold: 3, // Valeur initiale pour le seuil

    init(candidats) {
        let data = this.prepareData(candidats);
        this.renderChart(data);

        // Listener pour le slider
        let slider = document.getElementById("threshold-slider");
        slider.addEventListener("input", (event) => {
            this.threshold = parseInt(event.target.value);
            document.getElementById("threshold-value").textContent = this.threshold;
            this.renderChart(data); // Re-render le graphique
        });
    },

    // Fonction pour ajuster le code postal (ex : 45100 → 45000)
    adjustPostalCode(cp) {
        let departmentCode = cp.slice(0, 2);
        let cityCode = cp.slice(2, 5);
        if (parseInt(cityCode) > 100) {
            return departmentCode + '00'; // Regrouper par département
        } else {
            return cp.slice(0, 5); // Récupérer uniquement le code du département
        }
    },

    // Préparation des données pour le graphique
    prepareData(candidats) {
        let departments = {};

        candidats.forEach((cand) => {
            if (cand.Scolarite && cand.Scolarite.length > 0) {
                let cp = cand.Scolarite[0]?.CommuneEtablissementOrigineCodePostal;
                if (cp) {
                    let dep = this.adjustPostalCode(cp);

                    if (!departments[dep]) {
                        departments[dep] = { general: 0, sti2d: 0, autres: 0, total: 0 };
                    }

                    // Catégorisation des candidatures en fonction du Bac
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

                    departments[dep].total++;
                }
            }
        });

        return departments;
    },

    // Fonction pour afficher le graphique
    renderChart(data) {
        // Trier les départements par nombre total de candidatures
        let chartData = Object.keys(data)
            .map(dep => ({
                x: dep,  // Le nom du département
                general: data[dep].general, // Candidatures Générale
                sti2d: data[dep].sti2d, // Candidatures STI2D
                autres: data[dep].autres, // Autres candidatures
                total: data[dep].total // Total des candidatures
            }))
            .sort((a, b) => b.total - a.total); // Trier par total décroissant

        // Regrouper les départements en "Autres départements" si leur total est inférieur au seuil
        let groupedData = { general: 0, sti2d: 0, autres: 0, total: 0 };
        let filteredData = chartData.filter(row => {
            if (row.total > this.threshold) return true;

            groupedData.general += row.general;
            groupedData.sti2d += row.sti2d;
            groupedData.autres += row.autres;
            groupedData.total += row.total;

            return false;
        });

        // Ajouter les "Autres départements" si nécessaire
        if (groupedData.total > 0) {
            filteredData.push({
                x: "Autres départements",
                general: groupedData.general,
                sti2d: groupedData.sti2d,
                autres: groupedData.autres,
                total: groupedData.total
            });
        }

        // Si le graphique existe déjà, le vider
        if (this.chart) {
            this.chart.dispose();
        }

        // Créer un graphique stacked bar
        this.chart = anychart.bar();

        // Préparer les séries pour les données empilées
        let generalSeries = this.chart.bar(filteredData.map(row => ({ x: row.x, value: row.general })));
        let sti2dSeries = this.chart.bar(filteredData.map(row => ({ x: row.x, value: row.sti2d })));
        let autresSeries = this.chart.bar(filteredData.map(row => ({ x: row.x, value: row.autres })));
        let totalSeries = this.chart.bar(filteredData.map(row => ({ x: row.x, value: row.total }))); // Série "Total"

        // Ajouter les séries au graphique
        generalSeries.name("Générale");
        sti2dSeries.name("STI2D");
        autresSeries.name("Autres");
        totalSeries.name("Total"); // Ajouter le total comme série

        // Activer les labels pour chaque série
        generalSeries.labels(true);
        sti2dSeries.labels(true);
        autresSeries.labels(true);
        totalSeries.labels(true); // Activer les labels pour le total

        // Configuration du graphique
        this.chart.title("Candidatures par Département");
        this.chart.container("chart-container");
        this.chart.draw();
    },
};

export { ChartComponent };
