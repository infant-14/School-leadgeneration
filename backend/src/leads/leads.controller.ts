import { Controller, Get, Patch, Delete, Post, Param, Body, Query, Res, HttpCode, HttpStatus, Response } from '@nestjs/common';
import { LeadsService } from './leads.service';

@Controller()
export class LeadsController {
  constructor(private readonly leadsService: LeadsService) {}

  @Get('leads')
  async getLeads(
    @Query('search') search?: string,
    @Query('status') status?: string,
  ) {
    return this.leadsService.findAll(search, status);
  }

  @Patch('leads/:id/status')
  async patchLeadStatus(
    @Param('id') id: string,
    @Body('status') status: string,
  ) {
    return this.leadsService.updateStatus(Number(id), status);
  }

  @Delete('leads/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteLead(@Param('id') id: string) {
    return this.leadsService.remove(Number(id));
  }

  @Delete('leads')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteAllLeads() {
    return this.leadsService.removeAll();
  }

  @Get('download-excel')
  async downloadExcel(@Res() res) {
    try {
      const filePath = await this.leadsService.generateExcel();
      res.download(filePath, 'School_Leads_Report.xlsx');
    } catch (error) {
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: error.message || 'Failed to download Excel file',
      });
    }
  }

  @Post('sync-sheets')
  async syncSheets() {
    const output = await this.leadsService.syncToGoogleSheets();
    return {
      message: 'Successfully synced to Google Sheets!',
      output,
    };
  }

  @Post('leads')
  async createLead(@Body() body: any) {
    return this.leadsService.create(body);
  }
}
