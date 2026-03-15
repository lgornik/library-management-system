import { GraphQLScalarType, Kind } from 'graphql';

export const DateTimeScalar = new GraphQLScalarType({
  name: 'DateTime',
  description: 'ISO-8601 date-time string',

  serialize(value: unknown): string {
    if (value instanceof Date) {
      return value.toISOString();
    }
    if (typeof value === 'string') {
      return new Date(value).toISOString();
    }
    throw new Error('DateTime scalar: cannot serialize value');
  },

  parseValue(value: unknown): Date {
    if (typeof value === 'string') {
      const date = new Date(value);
      if (isNaN(date.getTime())) {
        throw new Error('DateTime scalar: invalid date string');
      }
      return date;
    }
    throw new Error('DateTime scalar: value must be a string');
  },

  parseLiteral(ast): Date {
    if (ast.kind === Kind.STRING) {
      const date = new Date(ast.value);
      if (isNaN(date.getTime())) {
        throw new Error('DateTime scalar: invalid date string');
      }
      return date;
    }
    throw new Error('DateTime scalar: value must be a string');
  },
});

export const scalarTypeDefs = /* GraphQL */ `
  scalar DateTime
`;

export const scalarResolvers = {
  DateTime: DateTimeScalar,
};
