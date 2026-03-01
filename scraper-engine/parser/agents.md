follow a the list.json 
if any src in prasing stage 
then create new script to parse the src in scripts folder in [src-name]/index.ts which take data as input cmd line argument (default today)
keep the need data in the folder it ie looping states and crops 
use bun to run the script 
output the data in json in data/[src-name]/[date].json

data format 
export const PriceSchema = z.object({
  cropName: z.string(),
  mandiName: z.string(),
  date: z.string(),
  minPrice: z.number(),
  maxPrice: z.number(),
  modalPrice: z.number(),
  unit: z.string(),
  arrival: z.number().optional(),
  source: string().optional(),
});