const assert = require('assert');
const ObjectID = require('mongodb').ObjectID;
const USER = 'user';



function User(db) {
	          this.db = db;
	          this.user = db.collection(USER);
}

User.prototype.newUser = function(data) {
	return this.user.insertOne({data}).
		then(function(results)
			{
				return new Promise((resolve) => resolve(results.insertedId));
			});
}

User.prototype.getUser = function(email, found) {
	const search = {"data.email": email};
	if(found === 'undefined')
	{
		found = true;
	}
	return this.user.find(search).toArray().
		then(function(user) {
			return new Promise(function(resolve, reject) {
				if (user.length === 1)
				{
					resolve(user[0]);
				}
				else if(user.length === 0 && !found)
				{
					resolve(null);
				}
				else 
				{
					reject(new Error(`cannot find user ${email}`));
				}
			});
		});
}

module.exports = {
	User: User,
};

