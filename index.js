const _ = require("lodash");

module.exports = bookshelf => {
  bookshelf.Model = bookshelf.Model.extend({

    upsert(updateAttributes, constraint) {
      const knex = bookshelf.knex;
      // 'constraint' is the current model's attached constraint
      // updateAttributes are what we want to change if they already exist
      const queryAttributes = {};
      // this only works with =s
      // XXX: and probably "IS NULL"/"IS NOT NULL"? oh sheez.
      this._knex._statements.forEach(c => {
        if (c.operator === "=") {
          queryAttributes[c.column] = c.value;
        } else {
          throw new Error("Invalid operator for upsertion");
        }
      });

      const insertionObject = _.extend({}, queryAttributes, updateAttributes);

      constraint = constraint || this.constraint || [];
      constraint = constraint.map(c => `"${c}"`);

      // if there aren't any constraints on the model, let's try to find something that matches
      if (!constraint.length) {
        return this.where(queryAttributes).fetchAll()
        .then(results => {
          if (!results.length) {
            return this.forge().save(insertionObject, {method: "insert"});
          } else if (results.length === 1) {
            return this.forge(results[0]).save(updateAttributes, {method: "update", patch: true});
          } else {
            throw new Error("Upsert query matches more than one row");
          }
        });
      } else {
        const insert = knex(this.tableName).insert(insertionObject);
        const update = knex().update(updateAttributes);

        return knex.raw(`? ON CONFLICT (${constraint.join(",")}) DO ? RETURNING *`, [insert, update])
        .then(x => console.log(x))
        .catch(e => console.log(e));
      }
    }
  },

    safeInsert(attributes) {
      const knex = bookshelf.knex;
      const insert = knex(this.tableName).insert(attributes);
      return bookshelf.knex.raw("? ON CONFLICT DO NOTHING RETURNING *", [insert]);
    },
  })
}
