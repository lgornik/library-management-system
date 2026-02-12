/**
 * Base class for Value Objects.
 *
 * Value Objects are immutable objects that are defined by their attributes
 * rather than by their identity. Two Value Objects are equal if all their
 * properties are equal.
 *
 * @example
 * interface MoneyProps {
 *   amount: number;
 *   currency: string;
 * }
 *
 * class Money extends ValueObject<MoneyProps> {
 *   get amount(): number { return this.props.amount; }
 *   get currency(): string { return this.props.currency; }
 *
 *   static create(amount: number, currency: string): Money {
 *     if (amount < 0) throw new Error('Amount cannot be negative');
 *     return new Money({ amount, currency });
 *   }
 *
 *   add(other: Money): Money {
 *     if (this.currency !== other.currency) {
 *       throw new Error('Cannot add different currencies');
 *     }
 *     return Money.create(this.amount + other.amount, this.currency);
 *   }
 * }
 */
export abstract class ValueObject<T extends Record<string, unknown>> {
  protected readonly props: Readonly<T>;

  protected constructor(props: T) {
    this.props = Object.freeze({ ...props });
  }

  /**
   * Check equality with another Value Object.
   * Two Value Objects are equal if all their properties are equal.
   */
  equals(other: ValueObject<T> | null | undefined): boolean {
    if (other === null || other === undefined) {
      return false;
    }
    if (other.constructor !== this.constructor) {
      return false;
    }
    return this.shallowEquals(this.props, other.props);
  }

  private shallowEquals(obj1: Record<string, unknown>, obj2: Record<string, unknown>): boolean {
    const keys1 = Object.keys(obj1);
    const keys2 = Object.keys(obj2);

    if (keys1.length !== keys2.length) {
      return false;
    }

    for (const key of keys1) {
      const val1 = obj1[key];
      const val2 = obj2[key];

      // Handle nested ValueObjects
      if (val1 instanceof ValueObject && val2 instanceof ValueObject) {
        if (!val1.equals(val2)) {
          return false;
        }
      } else if (val1 !== val2) {
        return false;
      }
    }

    return true;
  }

  /**
   * Create a copy of this Value Object with some properties changed.
   * Returns a new instance - Value Objects are immutable.
   */
  protected clone(props: Partial<T>): this {
    const Constructor = this.constructor as new (props: T) => this;
    return new Constructor({ ...this.props, ...props });
  }

  /**
   * Convert to plain object for serialization
   */
  toObject(): T {
    return { ...this.props };
  }

  /**
   * Convert to JSON
   */
  toJSON(): T {
    return this.toObject();
  }
}

/**
 * Simple Value Object for single primitive values.
 * Use this for wrapping simple types like strings or numbers with validation.
 *
 * @example
 * class Email extends SimpleValueObject<string> {
 *   static create(value: string): Email {
 *     if (!value.includes('@')) {
 *       throw new Error('Invalid email format');
 *     }
 *     return new Email(value.toLowerCase().trim());
 *   }
 * }
 */
export abstract class SimpleValueObject<T> {
  protected constructor(protected readonly _value: T) {
    Object.freeze(this);
  }

  get value(): T {
    return this._value;
  }

  equals(other: SimpleValueObject<T> | null | undefined): boolean {
    if (other === null || other === undefined) {
      return false;
    }
    if (other.constructor !== this.constructor) {
      return false;
    }
    return this._value === other._value;
  }

  toString(): string {
    return String(this._value);
  }

  toJSON(): T {
    return this._value;
  }
}
