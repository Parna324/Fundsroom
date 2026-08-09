import { Request, Response, NextFunction } from 'express';
import * as productService from '../services/product.service';
import * as challanService from '../services/challan.service';
import { findCustomers } from '../repositories/customer.repository';
import { sendSuccess } from '../utils/response';

export async function getDashboard(req: Request, res: Response, next: NextFunction) {
  try {
    const [
      customersResult,
      inventoryStats,
      lowStockProducts,
      challanStats,
      recentChallans,
      recentMovements,
    ] = await Promise.all([
      findCustomers({ page: 1, limit: 1, search: undefined, status: undefined, customerType: undefined }),
      productService.getInventoryStats(),
      productService.getLowStockProducts(),
      challanService.getChallanStats(),
      challanService.getRecentChallans(),
      productService.getAllRecentMovements(),
    ]);

    // Upcoming follow-ups (next 7 days)
    const { Pool } = await import('pg');
    const pool = (await import('../config/db')).default;
    const followUpsResult = await pool.query(`
      SELECT c.id, c.name, c.business_name, c.follow_up_date, c.status
      FROM customers c
      WHERE c.follow_up_date >= CURRENT_DATE
        AND c.follow_up_date <= CURRENT_DATE + INTERVAL '7 days'
        AND c.status != 'INACTIVE'
      ORDER BY c.follow_up_date ASC
      LIMIT 5
    `);

    sendSuccess(res, {
      kpis: {
        totalCustomers: customersResult.total,
        totalProducts: inventoryStats.totalProducts,
        totalStockUnits: inventoryStats.totalStockUnits,
        lowStockCount: inventoryStats.lowStockCount,
        draftChallans: challanStats.draft,
        confirmedChallans: challanStats.confirmed,
      },
      lowStockProducts: lowStockProducts.slice(0, 5),
      recentChallans,
      recentMovements: recentMovements.slice(0, 8),
      upcomingFollowUps: followUpsResult.rows,
    });
  } catch (err) { next(err); }
}
