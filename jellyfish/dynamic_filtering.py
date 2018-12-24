import sqlalchemy
from sqlalchemy.sql.functions import coalesce
import numbers

head = lambda l: l[0]
tail = lambda l: l[1:]
atomic = lambda x: isinstance(x, (bool, str, numbers.Number))


def in_(column, other):
    assert isinstance(other, list)
    assert all([atomic(el) for el in other])
    return column.in_(other)


def has_key(column, key):
    assert isinstance(key, str)

    return column.has_key(key)


def is_null(column):
    return column.is_(None)


class ClauseConstructor:
    def __init__(self, tables):
        self.tables = tables

        self.operators = {
            "<": sqlalchemy.sql.operators.lt,
            ">": sqlalchemy.sql.operators.gt,
            "<=": sqlalchemy.sql.operators.le,
            ">=": sqlalchemy.sql.operators.ge,
            "=": sqlalchemy.sql.operators.eq,
            "!=": sqlalchemy.sql.operators.ne,
            "all": sqlalchemy.sql.and_,
            "any": sqlalchemy.sql.or_,
            "val": self.val,
            "in": in_,
            "has_key": has_key,
            "is_null": is_null,
            "not": sqlalchemy.sql.not_,
            "coalesce": coalesce,
        }

    def val(self, *args):
        assert len(args) >= 2
        table_name = args[0]
        column_name = args[1]
        remaining = args[2:]
        column = self.tables[table_name].columns[column_name]

        if remaining:
            assert [
                isinstance(el, str) for el in remaining
            ], "Can't use expression in #>> operator"
            return column[tuple(remaining)].astext
        else:
            return column

    def __call__(self, expression):
        if atomic(expression):
            return expression

        assert isinstance(expression, list)

        operator_name = head(expression)
        assert operator_name in self.operators, "No such operator:{}".format(
            operator_name
        )
        operator = self.operators[operator_name]

        if operator_name == "quote":
            operands = tail(expression)
        else:
            operands = (self(x) for x in tail(expression))

        return operator(*operands)

    def apply(self, query, expression):
        clause = self(expression)
        filtered = query.where(clause)
        assert len(filtered.columns) == len(
            query.columns
        ), "Filter tried to change SELECT clause"
        assert filtered.froms == query.froms, "Filter tried to change FROM clause"
        return filtered

