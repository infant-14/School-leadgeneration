import { Controller, Get, Patch, Delete, Post, Param, Body, Query, Res, HttpCode, HttpStatus, Headers } from '@nestjs/common';
import { LeadsService } from './leads.service';

function getUserIdFromToken(headers: any): number | null {
  const authHeader = headers['authorization'] || headers['Authorization'];
  if (!authHeader) return null;
  const token = authHeader.replace('Bearer ', '').trim();
  if (token === 'session_token_leadflow_sa') {
    return 0; // Default admin
  }
  if (token.startsWith('session_token_')) {
    const parts = token.split('_');
    const userId = Number(parts[2]);
    return isNaN(userId) ? null : userId;
  }
  return null;
}

@Controller()
export class LeadsController {
  constructor(private readonly leadsService: LeadsService) {}

  @Get('leads')
  async getLeads(
    @Headers() headers: any,
    @Query('search') search?: string,
    @Query('status') status?: string,
  ) {
    const userId = getUserIdFromToken(headers);
    return this.leadsService.findAll(userId, search, status);
  }

  @Patch('leads/:id/status')
  async patchLeadStatus(
    @Param('id') id: string,
    @Body('status') status: string,
    @Headers() headers: any,
  ) {
    const userId = getUserIdFromToken(headers);
    return this.leadsService.updateStatus(Number(id), status, userId);
  }

  @Delete('leads/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteLead(@Param('id') id: string, @Headers() headers: any) {
    const userId = getUserIdFromToken(headers);
    return this.leadsService.remove(Number(id), userId);
  }

  @Delete('leads')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteAllLeads(@Headers() headers: any) {
    const userId = getUserIdFromToken(headers);
    return this.leadsService.removeAll(userId);
  }

  @Get('download-excel')
  async downloadExcel(
    @Headers() headers: any,
    @Query('token') queryToken: string,
    @Res() res,
  ) {
    try {
      const authHeader = headers['authorization'] || headers['Authorization'] || (queryToken ? `Bearer ${queryToken}` : undefined);
      const userId = getUserIdFromToken({ authorization: authHeader });
      const filePath = await this.leadsService.generateExcel(userId);
      res.download(filePath, 'School_Leads_Report.xlsx');
    } catch (error) {
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: error.message || 'Failed to download Excel file',
      });
    }
  }

  @Post('sync-sheets')
  async syncSheets(@Headers() headers: any) {
    const userId = getUserIdFromToken(headers);
    const output = await this.leadsService.syncToGoogleSheets(userId);
    return {
      message: 'Successfully synced to Google Sheets!',
      output,
    };
  }

  @Post('leads')
  async createLead(@Body() body: any, @Headers() headers: any) {
    const userId = getUserIdFromToken(headers);
    return this.leadsService.create(body, userId);
  }
}
