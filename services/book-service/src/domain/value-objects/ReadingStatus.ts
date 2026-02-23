/**
 * Reading status of a book.
 */
export enum ReadingStatus {
  /** Book is in the "to read" queue */
  TO_READ = 'TO_READ',

  /** Currently reading this book */
  READING = 'READING',

  /** Finished reading the book */
  FINISHED = 'FINISHED',

  /** Stopped reading without finishing */
  ABANDONED = 'ABANDONED',
}

/**
 * Helper functions for ReadingStatus
 */
export const ReadingStatusUtils = {
  /**
   * Check if a string is a valid ReadingStatus
   */
  isValid(value: string): value is ReadingStatus {
    return Object.values(ReadingStatus).includes(value as ReadingStatus);
  },

  /**
   * Parse a string to ReadingStatus
   */
  fromString(value: string): ReadingStatus {
    if (!this.isValid(value)) {
      throw new Error(`Invalid reading status: ${value}`);
    }
    return value as ReadingStatus;
  },

  /**
   * Get human-readable label
   */
  toLabel(status: ReadingStatus): string {
    const labels: Record<ReadingStatus, string> = {
      [ReadingStatus.TO_READ]: 'To Read',
      [ReadingStatus.READING]: 'Reading',
      [ReadingStatus.FINISHED]: 'Finished',
      [ReadingStatus.ABANDONED]: 'Abandoned',
    };
    return labels[status];
  },

  /**
   * Get all possible transitions from a status
   */
  getAllowedTransitions(status: ReadingStatus): ReadingStatus[] {
    const transitions: Record<ReadingStatus, ReadingStatus[]> = {
      [ReadingStatus.TO_READ]: [ReadingStatus.READING],
      [ReadingStatus.READING]: [ReadingStatus.FINISHED, ReadingStatus.ABANDONED, ReadingStatus.TO_READ],
      [ReadingStatus.FINISHED]: [ReadingStatus.READING], // Re-read
      [ReadingStatus.ABANDONED]: [ReadingStatus.READING, ReadingStatus.TO_READ],
    };
    return transitions[status];
  },

  /**
   * Check if a transition is allowed
   */
  canTransition(from: ReadingStatus, to: ReadingStatus): boolean {
    return this.getAllowedTransitions(from).includes(to);
  },
};
