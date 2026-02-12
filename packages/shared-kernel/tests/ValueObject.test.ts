import { describe, it, expect } from 'vitest';
import { ValueObject, SimpleValueObject } from '../src/domain/ValueObject.js';

// Test implementations
interface MoneyProps {
  amount: number;
  currency: string;
}

class Money extends ValueObject<MoneyProps> {
  get amount(): number {
    return this.props.amount;
  }
  get currency(): string {
    return this.props.currency;
  }

  static create(amount: number, currency: string): Money {
    if (amount < 0) {
      throw new Error('Amount cannot be negative');
    }
    return new Money({ amount, currency });
  }

  add(other: Money): Money {
    if (this.currency !== other.currency) {
      throw new Error('Cannot add different currencies');
    }
    return Money.create(this.amount + other.amount, this.currency);
  }
}

class Email extends SimpleValueObject<string> {
  static create(value: string): Email {
    if (!value.includes('@')) {
      throw new Error('Invalid email format');
    }
    return new Email(value.toLowerCase().trim());
  }
}

describe('ValueObject', () => {
  describe('equality', () => {
    it('should be equal when all properties are equal', () => {
      const money1 = Money.create(100, 'USD');
      const money2 = Money.create(100, 'USD');

      expect(money1.equals(money2)).toBe(true);
    });

    it('should not be equal when properties differ', () => {
      const money1 = Money.create(100, 'USD');
      const money2 = Money.create(200, 'USD');
      const money3 = Money.create(100, 'EUR');

      expect(money1.equals(money2)).toBe(false);
      expect(money1.equals(money3)).toBe(false);
    });

    it('should not be equal to null or undefined', () => {
      const money = Money.create(100, 'USD');

      expect(money.equals(null)).toBe(false);
      expect(money.equals(undefined)).toBe(false);
    });
  });

  describe('immutability', () => {
    it('should be immutable', () => {
      const money = Money.create(100, 'USD');

      expect(() => {
        (money as any).props.amount = 200;
      }).toThrow();
    });
  });

  describe('business logic', () => {
    it('should validate on creation', () => {
      expect(() => Money.create(-100, 'USD')).toThrow('Amount cannot be negative');
    });

    it('should support domain operations', () => {
      const money1 = Money.create(100, 'USD');
      const money2 = Money.create(50, 'USD');
      const result = money1.add(money2);

      expect(result.amount).toBe(150);
      expect(result.currency).toBe('USD');
    });

    it('should enforce invariants in operations', () => {
      const usd = Money.create(100, 'USD');
      const eur = Money.create(50, 'EUR');

      expect(() => usd.add(eur)).toThrow('Cannot add different currencies');
    });
  });

  describe('serialization', () => {
    it('should convert to object', () => {
      const money = Money.create(100, 'USD');
      const obj = money.toObject();

      expect(obj).toEqual({ amount: 100, currency: 'USD' });
    });

    it('should convert to JSON', () => {
      const money = Money.create(100, 'USD');
      const json = JSON.stringify(money);

      expect(JSON.parse(json)).toEqual({ amount: 100, currency: 'USD' });
    });
  });
});

describe('SimpleValueObject', () => {
  describe('equality', () => {
    it('should be equal when values are equal', () => {
      const email1 = Email.create('Test@Example.com');
      const email2 = Email.create('test@example.com');

      expect(email1.equals(email2)).toBe(true);
    });

    it('should not be equal when values differ', () => {
      const email1 = Email.create('test@example.com');
      const email2 = Email.create('other@example.com');

      expect(email1.equals(email2)).toBe(false);
    });
  });

  describe('validation', () => {
    it('should validate on creation', () => {
      expect(() => Email.create('invalid-email')).toThrow('Invalid email format');
    });

    it('should normalize values', () => {
      const email = Email.create('  TEST@EXAMPLE.COM  ');

      expect(email.value).toBe('test@example.com');
    });
  });

  describe('serialization', () => {
    it('should convert to string', () => {
      const email = Email.create('test@example.com');

      expect(email.toString()).toBe('test@example.com');
    });

    it('should convert to JSON', () => {
      const email = Email.create('test@example.com');
      const json = JSON.stringify({ email });

      expect(JSON.parse(json)).toEqual({ email: 'test@example.com' });
    });
  });
});
