
import Papa from 'papaparse';

export interface WorkerOffer {
    img: string;
    name: string;
    city: string;
    price: string;
    title: string;
    description: string;
}

const CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vR2x9xCCFOFxZDbiaNxrexwlv_Nr6cf02HghSESgPsNOkhkqriGPiKpJxu8rMVuAU9GoMwIpPJvpZo1/pub?output=csv';

export const googleSheetsService = {
    async fetchWorkerOffers(): Promise<WorkerOffer[]> {
        try {
            const response = await fetch(CSV_URL);
            if (!response.ok) throw new Error('Failed to fetch Google Sheet data');
            
            let csvText = await response.text();
            // Remove UTF-8 BOM if present
            if (csvText.charCodeAt(0) === 0xFEFF) {
                csvText = csvText.substring(1);
            }
            console.log('Google Sheets Raw Text (First 100 chars):', csvText.substring(0, 100));
            
            if (csvText.includes('<!DOCTYPE html>') || csvText.includes('<html')) {
                throw new Error('The URL returned HTML instead of CSV. Please make sure the Google Sheet is published to the web as a CSV.');
            }
            
            return new Promise((resolve, reject) => {
                Papa.parse(csvText, {
                    header: false, // Parse without headers to be most flexible
                    skipEmptyLines: true,
                    complete: (results) => {
                        const rows = results.data as string[][];
                        console.log('Google Sheets Raw Rows:', rows);
                        
                        if (rows.length === 0) {
                            console.warn('Google Sheets: No data rows found in CSV.');
                            resolve([]);
                            return;
                        }

                        // Helper to extract value from a cell that might contain a label (e.g., "Prénom: Mori")
                        const extractValue = (cell: string, keywords: string[]) => {
                            if (!cell) return '';
                            let val = cell.trim();
                            
                            // Check if cell starts with any of the keywords followed by a colon or space
                            for (const kw of keywords) {
                                const regex = new RegExp(`^${kw}[:\\s]*`, 'i');
                                if (regex.test(val)) {
                                    val = val.replace(regex, '').trim();
                                    break;
                                }
                            }

                            // Special handling for images: extract URL if present
                            if (keywords.includes('Image') || keywords.includes('Photo')) {
                                const urlMatch = val.match(/https?:\/\/[^\s,]+/);
                                if (urlMatch) return urlMatch[0];
                            }

                            return val;
                        };

                        // Helper to find a value in a row by searching for keywords in each cell
                        const findInRow = (row: string[], keywords: string[]) => {
                            for (const cell of row) {
                                if (!cell) continue;
                                for (const kw of keywords) {
                                    if (cell.toLowerCase().includes(kw.toLowerCase())) {
                                        return extractValue(cell, keywords);
                                    }
                                }
                            }
                            return '';
                        };

                        const mappedData: WorkerOffer[] = rows.map((row, idx) => {
                            const offer = {
                                img: findInRow(row, ['Image', 'Photo', 'Cliquer']),
                                name: findInRow(row, ['Prénom', 'Nom']),
                                city: findInRow(row, ['Ville', 'Localisation', 'Commune']),
                                price: findInRow(row, ['Salaire', 'Prix', 'Montant', 'Rémunération']),
                                title: findInRow(row, ['Poste', 'Métier', 'Service', 'Job', 'Titre']),
                                description: findInRow(row, ['Description', 'Détails', 'Infos']) || 'Travailleur qualifié disponible'
                            };

                            // Skip header row if it's just the labels
                            if (offer.name.toLowerCase() === 'prénom' || offer.title.toLowerCase() === 'poste') {
                                return null;
                            }

                            return offer;
                        }).filter((item): item is WorkerOffer => item !== null && (!!item.name || !!item.title));
                        
                        console.log('Mapped Worker Offers (Resilient):', mappedData);
                        resolve(mappedData);
                    },
                    error: (error: any) => {
                        reject(error);
                    }
                });
            });
        } catch (error) {
            console.error('Error fetching Google Sheets data:', error);
            return [];
        }
    }
};
