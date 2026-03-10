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
  PageOrientation,
  Header,
  ImageRun,
  BorderStyle
} from 'docx';
import { Animal, LogEntry, LogType } from '../../../types';

interface ReportConfig {
  logoUrl?: string;
  reportName: string;
  startDate: string;
  endDate: string;
  generatedBy: string;
}

const getLogoBuffer = async (url?: string): Promise<ArrayBuffer | null> => {
  if (!url || url.trim() === '' || url.startsWith('data:')) return null; // Reject old Base64 strings safely
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error("Failed to fetch logo from koa-attachments bucket");
    return await response.arrayBuffer();
  } catch (e) {
    console.warn("Could not load logo for report (user may be offline):", e);
    return null;
  }
};

const createDocumentHeader = async (config?: ReportConfig): Promise<Table> => {
  const logoBuffer = await getLogoBuffer(config?.logoUrl);

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: {
      top: { style: BorderStyle.NONE, size: 0 },
      bottom: { style: BorderStyle.NONE, size: 0 },
      left: { style: BorderStyle.NONE, size: 0 },
      right: { style: BorderStyle.NONE, size: 0 },
      insideHorizontal: { style: BorderStyle.NONE, size: 0 },
      insideVertical: { style: BorderStyle.NONE, size: 0 },
    },
    rows: [
      new TableRow({
        children: [
          new TableCell({
            width: { size: 30, type: WidthType.PERCENTAGE },
            children: logoBuffer ? [
              new Paragraph({
                children: [
                  new ImageRun({
                    data: logoBuffer,
                    transformation: { width: 150, height: 80 },
                    type: 'png',
                  }),
                ],
              }),
            ] : [],
          }),
          new TableCell({
            width: { size: 70, type: WidthType.PERCENTAGE },
            children: [
              new Paragraph({ children: [new TextRun({ text: config?.reportName || '', bold: true, size: 28 })], alignment: AlignmentType.RIGHT }),
              new Paragraph({ children: [new TextRun({ text: `Date: ${config?.startDate === config?.endDate ? config.startDate : config?.startDate + ' to ' + config?.endDate}`, size: 20, color: "666666" })], alignment: AlignmentType.RIGHT }),
              new Paragraph({ children: [new TextRun({ text: `Generated: ${new Date().toLocaleDateString()}`, size: 20, color: "666666" })], alignment: AlignmentType.RIGHT }),
              new Paragraph({ children: [new TextRun({ text: `Initials: ${config?.generatedBy || ''}`, size: 20, color: "666666" })], alignment: AlignmentType.RIGHT }),
            ],
          }),
        ],
      }),
    ],
  });
};

export const generateDailyLogDocx = async (
  animals: Animal[],
  logs: LogEntry[],
  startDate: string,
  endDate: string,
  category: string,
  orientation: 'portrait' | 'landscape',
  config?: ReportConfig
): Promise<Blob> => {
  const headerTable = await createDocumentHeader(config);
  const dates = [];
  const start = new Date(startDate);
  const end = new Date(endDate);
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    dates.push(d.toISOString().split('T')[0]);
  }

  const filteredAnimals = animals.filter(a => category === 'ALL' || a.category.toUpperCase() === category.toUpperCase());

  const sections = dates.map(date => {
    const tableRows = filteredAnimals.map(animal => {
      const weightLog = logs.find(l => l.animal_id === animal.id && l.log_date === date && l.log_type === LogType.WEIGHT);
      const feedLog = logs.find(l => l.animal_id === animal.id && l.log_date === date && l.log_type === LogType.FEED);

      interface NotesData {
        cast?: string;
        feedTime?: string;
      }
      let notesData: NotesData = {};
      if (feedLog?.notes) {
        try {
          notesData = JSON.parse(feedLog.notes) as NotesData;
        } catch {
          notesData = {};
        }
      }

      return new TableRow({
        children: [
          new TableCell({ children: [new Paragraph(animal.name)] }),
          new TableCell({ children: [new Paragraph(animal.species)] }),
          new TableCell({ children: [new Paragraph(animal.latin_name || 'N/A')] }),
          new TableCell({ children: [new Paragraph(weightLog?.value || '--')] }),
          new TableCell({ children: [new Paragraph(notesData.cast || '--')] }),
          new TableCell({ children: [new Paragraph(feedLog?.value || '--')] }),
          new TableCell({ children: [new Paragraph(notesData.feedTime || '--')] }),
          new TableCell({ children: [new Paragraph(feedLog?.user_initials || '--')] }),
        ],
      });
    });

    const table = new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      columnWidths: [
        2000, // Name
        2000, // Species
        2000, // Latin Name
        1200, // Weight
        1200, // Cast
        4500, // Food (Massive width)
        1200, // Feed Time
        900,  // Initials (Tiny width)
      ],
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

    return {
      properties: {
        page: {
          size: {
            orientation: orientation === 'landscape' ? PageOrientation.LANDSCAPE : PageOrientation.PORTRAIT,
          },
        },
      },
      headers: {
        default: new Header({
          children: [headerTable]
        })
      },
      children: [
        new Paragraph({ text: "", spacing: { after: 400 } }),
        new Paragraph({
          text: date,
          heading: "Heading2",
        }),
        table
      ]
    };
  });

  const doc = new Document({ 
    styles: {
      default: {
        document: {
          run: {
            font: "Arial",
            size: 24, // 12pt font
          },
        },
      },
    },
    sections 
  });
  return await Packer.toBlob(doc);
};
