import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function cleanMockData() {
  console.log('Starting cleanup of mock data from database...');

  try {
    const deletedProducts = await prisma.product.deleteMany({});
    console.log(`Deleted ${deletedProducts.count} products.`);

    const deletedOffers = await prisma.transportOffer.deleteMany({});
    console.log(`Deleted ${deletedOffers.count} transport offers.`);

    const deletedRequests = await prisma.transportRequest.deleteMany({});
    console.log(`Deleted ${deletedRequests.count} transport requests.`);

    const deletedJobApps = await prisma.jobApplication.deleteMany({});
    console.log(`Deleted ${deletedJobApps.count} job applications.`);

    const deletedJobs = await prisma.job.deleteMany({});
    console.log(`Deleted ${deletedJobs.count} jobs.`);

    const deletedArticles = await prisma.article.deleteMany({});
    console.log(`Deleted ${deletedArticles.count} news articles.`);

    console.log('All mock data successfully purged from the database!');
  } catch (error) {
    console.error('Error during cleanup:', error);
  } finally {
    await prisma.$disconnect();
  }
}

cleanMockData();
