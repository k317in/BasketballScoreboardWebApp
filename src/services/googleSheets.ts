import { GoogleSheetsData, TeamRoster, GameSchedule, Player } from '../types/thursday';

const GOOGLE_SHEETS_BASE_URL = 'https://docs.google.com/spreadsheets/d';

export class GoogleSheetsService {
  private sheetId: string;
  private teamRosterTab: string;
  private gameScheduleTab: string;

  constructor() {
    this.sheetId = import.meta.env.VITE_GOOGLE_SHEET_ID || '';
    this.teamRosterTab = import.meta.env.VITE_TEAM_ROSTER_TAB || 'Team Roster';
    this.gameScheduleTab = import.meta.env.VITE_GAME_SCHEDULE_TAB || 'Game Schedule';
  }

  private buildSheetUrl(tabName: string): string {
    return `${GOOGLE_SHEETS_BASE_URL}/${this.sheetId}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(tabName)}`;
  }

  private async fetchSheetData(tabName: string): Promise<any[][]> {
    try {
      const url = this.buildSheetUrl(tabName);
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch sheet data: ${response.statusText}`);
      }

      const csvText = await response.text();
      return this.parseCsv(csvText);
    } catch (error) {
      console.error(`Error fetching sheet data for tab "${tabName}":`, error);
      throw error;
    }
  }

  private parseCsv(csvText: string): any[][] {
    const lines = csvText.split('\n');
    const result: any[][] = [];

    for (const line of lines) {
      if (line.trim()) {
        // Simple CSV parsing - handles quoted fields
        const row: string[] = [];
        let current = '';
        let inQuotes = false;

        for (let i = 0; i < line.length; i++) {
          const char = line[i];
          
          if (char === '"') {
            inQuotes = !inQuotes;
          } else if (char === ',' && !inQuotes) {
            row.push(current.trim());
            current = '';
          } else {
            current += char;
          }
        }
        
        row.push(current.trim());
        result.push(row);
      }
    }

    return result;
  }

  private parseTeamRoster(data: any[][]): TeamRoster[] {
    if (data.length < 2) return [];

    const teams = new Map<string, Player[]>();
    
    // Skip header row
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      if (row.length >= 3) {
        const teamName = row[0]?.toString().trim();
        const playerName = row[1]?.toString().trim();
        const position = row[2]?.toString().trim();

        if (teamName && playerName) {
          if (!teams.has(teamName)) {
            teams.set(teamName, []);
          }
          teams.get(teamName)!.push({
            name: playerName,
            position: position || 'Player'
          });
        }
      }
    }

    return Array.from(teams.entries()).map(([teamName, players]) => ({
      teamName,
      players
    }));
  }

  private parseGameSchedule(data: any[][]): GameSchedule[] {
    if (data.length < 2) return [];

    const schedule: GameSchedule[] = [];
    
    // Skip header row
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      if (row.length >= 3) {
        const gameOrder = parseInt(row[0]?.toString().trim() || '0');
        const homeTeam = row[1]?.toString().trim();
        const awayTeam = row[2]?.toString().trim();

        if (gameOrder > 0 && homeTeam && awayTeam) {
          schedule.push({
            gameOrder,
            homeTeam,
            awayTeam
          });
        }
      }
    }

    return schedule.sort((a, b) => a.gameOrder - b.gameOrder);
  }

  async fetchAllData(): Promise<{ teams: TeamRoster[]; schedule: GameSchedule[] }> {
    if (!this.sheetId) {
      throw new Error('Google Sheet ID not configured. Please set VITE_GOOGLE_SHEET_ID in your environment variables.');
    }

    try {
      const [teamRosterData, gameScheduleData] = await Promise.all([
        this.fetchSheetData(this.teamRosterTab),
        this.fetchSheetData(this.gameScheduleTab)
      ]);

      const teams = this.parseTeamRoster(teamRosterData);
      const schedule = this.parseGameSchedule(gameScheduleData);

      return { teams, schedule };
    } catch (error) {
      console.error('Error fetching Google Sheets data:', error);
      throw error;
    }
  }

  isConfigured(): boolean {
    return !!this.sheetId;
  }

  async updateGameResult(gameOrder: number, result: string): Promise<void> {
    if (!this.sheetId) {
      throw new Error('Google Sheet ID not configured');
    }

    // Note: This is a simplified approach. In a real implementation,
    // you would need to use the Google Sheets API with proper authentication
    // to write data back to the sheet. For now, we'll just log the action.
    console.log(`Would update game ${gameOrder} with result: ${result}`);
    
    // In a full implementation, you would:
    // 1. Use Google Sheets API with OAuth2 authentication
    // 2. Find the row with the matching game order
    // 3. Update the result column (column D) for that row
    
    throw new Error('Writing to Google Sheets requires API authentication. This is a read-only implementation.');
  }
}

export const googleSheetsService = new GoogleSheetsService();