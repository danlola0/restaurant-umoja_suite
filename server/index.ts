import dotenv from 'dotenv';
import { createCashierApp } from './cashierApp';

dotenv.config({ path: '.env.local' });
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';
const port = Number(process.env.API_PORT || 3001);

const app = createCashierApp({
  supabaseUrl,
  supabaseAnonKey,
  standalone: true,
});

app.listen(port, () => {
  console.log(`API caissier Umoja disponible sur http://localhost:${port}`);
});
