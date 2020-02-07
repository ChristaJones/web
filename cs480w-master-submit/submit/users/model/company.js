const assert = require('assert');
const ObjectID = require('mongodb').ObjectID;
const COMPANY = 'company';
function Company(db) {
          this.db = db;
          this.company = db.collection(COMPANY);
}
Company.prototype.getCompany = function(id) {
        const search = {'_id': id};
        return this.company.findOne(search).
                then(function(results) {
                        return new Promise(function(resolve, reject) {
                                if (results)
                                {
                                        resolve(results);
                                }
                                else
                                {
                                        reject(new Error(`cannot find company ${id}`));
                                }
                        });
                });
}
Company.prototype.newCompany = function(id, data) {
        const search = data;
        return this.company.insertOne({"_id":id, data}).
                then(function(results)
                {
                        return new Promise((resolve) => resolve(results.insertedId));
                });
}
Company.prototype.updateCompany = function(id, data) {
        const search = {'_id': id};
        const change = { update: data};
        return this.company.findOneAndUpdate(search, {$set: {data}}).
                then(function(results) {
                        return new Promise((resolve) => resolve(id));
                });
}
Company.prototype.deleteCompany = function(id) {
        const search = {'_id': id};
        return this.company.deleteOne(search).
                then(function(results)
                {
                        return new Promise(function(resolve, reject)
                        {
                                if (results.deletedCount === 1)
                                {
                                        resolve();
                                }
                                else {
                                        reject(new Error(`cannot delete company ${id}`));
                                }
                        });
                });
}
module.exports = {
          Company: Company,
};
                                                                                                                                                                                                     66,2          Bot