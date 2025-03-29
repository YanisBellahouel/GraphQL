const { ApolloServer, gql } = require('apollo-server');

// Définir le schéma
const typeDefs = gql`
	type Query {
		user: Users
	}

	type Users {
		id: ID!
		name: String!
		email: String!
	}
`;

// Définir les résolveurs
const resolvers = {
	Query: {
		user: () => ({
			id: "1",
			name: "John Doe",
			email: "john.doe@example.com",
		}),
	},
};

// Créer le serveur
const server = new ApolloServer({ typeDefs, resolvers });

// Lancer le serveur
server.listen().then(({ url }) => {
	console.log(`${url}`);
});