import { 
  Document, 
  Packer, 
  Paragraph, 
  TextRun, 
  Table, 
  TableRow, 
  TableCell, 
  WidthType, 
  AlignmentType,
  PageOrientation
} from 'docx';
import { Animal, LogEntry, LogType } from '../../../types';

export const generateDailyLogDocx = async (
  animals: Animal[],
  logs: LogEntry[],
  dates: string[],
  category: string
): Promise<Blob> => {
  const doc = new Document({
    sections: [{
      properties: {
        orientation: PageOrientation.LANDSCAPE,
      },
      children: dates.flatMap((date, index) => {
        const filteredAnimals = animals.filter(a => category === 'ALL' || a.category.toUpperCase() === category.toUpperCase());
        
        const tableRows = filteredAnimals.map(animal => {
          const weightLog = logs.find(l => l.animal_id === animal.id && l.log_date === date && l.log_type === LogType.WEIGHT);
          const feedLog = logs.find(l => l.animal_id === animal.id && l.log_date === date && l.log_type === LogType.FEED);

          let cast = 'N/A';
          let feedTime = 'N/A';

          if (feedLog?.notes) {
            try {
              const parsedNotes = JSON.parse(feedLog.notes);
              cast = parsedNotes?.cast || 'N/A';
              feedTime = parsedNotes?.feedTime || 'N/A';
            } catch {
              // Ignore
            }
          }

          return new TableRow({
            children: [
              new TableCell({ children: [new Paragraph(animal.name)] }),
              new TableCell({ children: [new Paragraph(animal.species)] }),
              new TableCell({ children: [new Paragraph(animal.latin_name || 'N/A')] }),
              new TableCell({ children: [new Paragraph(weightLog?.value || 'N/A')] }),
              new TableCell({ children: [new Paragraph(cast)] }),
              new TableCell({ children: [new Paragraph(feedLog?.value || 'N/A')] }),
              new TableCell({ children: [new Paragraph(feedTime)] }),
              new TableCell({ children: [new Paragraph(feedLog?.user_initials || feedLog?.created_by || 'N/A')] }),
            ],
          });
        });

        const table = new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          rows: [
            new TableRow({
              tableHeader: true,
              children: ["Name", "Species", "Latin Name", "Weight", "Cast", "Food", "Feed Time", "Initials"].map(header => 
                new TableCell({
                  shading: { fill: "F3F4F6" },
                  children: [new Paragraph({ children: [new TextRun({ text: header, bold: true })], alignment: AlignmentType.CENTER })],
                })
              ),
            }),
            ...tableRows
          ],
        });

        return [
          new Paragraph({
            text: `Daily Log - ${date}`,
            heading: "Heading1",
            pageBreakBefore: index !== 0,
          }),
          table
        ];
      })
    }]
  });

  return await Packer.toBlob(doc);
};
