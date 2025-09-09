// Demo storage for development - in production this would be a database
class DemoStorage {
  private todayCards: { zen?: any; warrior?: any } = {};
  private cardDate: string | null = null;

  getTodayCard(mode: 'zen' | 'warrior'): any {
    const today = new Date().toISOString().split('T')[0];
    if (this.cardDate === today && this.todayCards[mode]) {
      return this.todayCards[mode];
    }
    return null;
  }

  setTodayCard(card: any, mode: 'zen' | 'warrior'): void {
    const today = new Date().toISOString().split('T')[0];
    if (this.cardDate !== today) {
      // New day, reset cards
      this.todayCards = {};
      this.cardDate = today;
    }
    this.todayCards[mode] = card;
  }

  hasCardForToday(mode: 'zen' | 'warrior'): boolean {
    const today = new Date().toISOString().split('T')[0];
    return this.cardDate === today && this.todayCards[mode] !== undefined;
  }

  updateCard(cardId: string, updates: any): any | null {
    const today = new Date().toISOString().split('T')[0];
    if (this.cardDate === today) {
      // Check both zen and warrior cards
      for (const mode of ['zen', 'warrior'] as const) {
        if (this.todayCards[mode] && this.todayCards[mode].id === cardId) {
          this.todayCards[mode] = { ...this.todayCards[mode], ...updates };
          return this.todayCards[mode];
        }
      }
    }
    return null;
  }
}

// Export a singleton instance
export const demoStorage = new DemoStorage(); 