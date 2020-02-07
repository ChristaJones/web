const company = require('./company');
function Model(db) {
          this.company = new company.Company(db);
}
module.exports = {
          Model: Model
};