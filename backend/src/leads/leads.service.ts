import { Injectable, InternalServerErrorException, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, IsNull } from 'typeorm';
import { Lead } from '../entities/lead.entity';
import * as path from 'path';
import * as fs from 'fs';
import * as ExcelJS from 'exceljs';
import { google } from 'googleapis';

@Injectable()
export class LeadsService {
  private readonly logger = new Logger(LeadsService.name);
  private readonly rootDir = path.resolve(__dirname, '../../..');

  constructor(
    @InjectRepository(Lead)
    private readonly leadsRepository: Repository<Lead>,
  ) {}

  async findAll(userId: number | null, search?: string, status?: string): Promise<Lead[]> {
    const where: any = {};
    where.userId = userId === null ? IsNull() : userId;

    if (status) {
      where.status = status;
    }

    if (search) {
      // Return leads where school_name, area_name, search_area, address or remarks matches search
      return this.leadsRepository.find({
        where: [
          { ...where, school_name: Like(`%${search}%`) },
          { ...where, area_name: Like(`%${search}%`) },
          { ...where, search_area: Like(`%${search}%`) },
          { ...where, address: Like(`%${search}%`) },
          { ...where, remarks: Like(`%${search}%`) },
        ],
        order: { batch_id: 'DESC', id: 'ASC' },
      });
    }

    return this.leadsRepository.find({
      where,
      order: { batch_id: 'DESC', id: 'ASC' },
    });
  }

  async updateStatus(id: number, status: string, userId: number | null): Promise<Lead> {
    const lead = await this.leadsRepository.findOne({ where: { id, userId: userId === null ? IsNull() : userId } });
    if (!lead) {
      throw new NotFoundException(`Lead with ID ${id} not found`);
    }
    lead.status = status;
    return this.leadsRepository.save(lead);
  }

  async remove(id: number, userId: number | null): Promise<void> {
    const result = await this.leadsRepository.delete({ id, userId: userId === null ? IsNull() : userId });
    if (result.affected === 0) {
      throw new NotFoundException(`Lead with ID ${id} not found`);
    }
  }

  async removeAll(userId: number | null): Promise<void> {
    await this.leadsRepository.delete({ userId: userId === null ? IsNull() : userId });
  }

  async create(leadData: Partial<Lead>, userId: number | null): Promise<Lead> {
    const lead = this.leadsRepository.create({ ...leadData, userId });
    return this.leadsRepository.save(lead);
  }

  async generateExcel(userId: number | null): Promise<string> {
    try {
      const leads = await this.leadsRepository.find({
        where: { userId: userId === null ? IsNull() : userId },
        order: { batch_id: 'DESC', id: 'ASC' }
      });
      const exportPath = path.join(this.rootDir, 'school_leads_export.xlsx');

      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('School Leads');

      // Show gridlines
      worksheet.views = [{ showGridLines: true }];

      // Define styling constants matching python
      const COLOR_BLUE_HEADER = 'FF002060';
      const COLOR_WHITE = 'FFFFFFFF';
      const COLOR_GREEN_ACTIVE = 'FF1F4E3D';
      const COLOR_RED_INACTIVE = 'FF9C0006';
      const COLOR_PURPLE_FRESH = 'FF7030A0';
      const COLOR_LIGHT_GRAY = 'FFF2F2F2';
      const COLOR_LIGHT_BLUE_TYPE = 'FFD9E1F2';
      const COLOR_DARK_BLUE_TYPE = 'FF305496';
      const COLOR_LIGHT_GREEN_APP = 'FFE2EFDA';
      const COLOR_DARK_GREEN_APP = 'FF375623';

      const thinBorder: Partial<ExcelJS.Borders> = {
        top: { style: 'thin', color: { argb: 'FFD3D3D3' } },
        left: { style: 'thin', color: { argb: 'FFD3D3D3' } },
        bottom: { style: 'thin', color: { argb: 'FFD3D3D3' } },
        right: { style: 'thin', color: { argb: 'FFD3D3D3' } }
      };

      const HEADERS = [
        "S.No.",
        "School Name",
        "Customer Name",
        "Institution Type",
        "Social Media",
        "Area Name",
        "Institution Atmosphere",
        "Website URL",
        "Contact Number",
        "School Address",
        "Pincode",
        "Appearance",
        "Remarks"
      ];

      // Append headers
      worksheet.addRow(HEADERS);
      const headerRow = worksheet.getRow(1);
      headerRow.height = 28;
      headerRow.eachCell((cell) => {
        cell.font = { name: 'Arial', size: 11, bold: true, color: { argb: COLOR_WHITE } };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLOR_BLUE_HEADER } };
        cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
        cell.border = thinBorder;
      });

      // Append rows
      leads.forEach((lead, idx) => {
        const rowData = [
          idx + 1,
          lead.school_name || "",
          "", // Customer Name
          lead.institution_type || "Matriculation",
          lead.social_media || "Inactive",
          lead.area_name || "",
          lead.atmosphere || "Good",
          lead.website_url || "",
          lead.contact_number || "",
          lead.address || "",
          lead.pincode || "",
          lead.appearance || "Redesign",
          lead.remarks || ""
        ];
        worksheet.addRow(rowData);
        
        const rowNum = idx + 2;
        const row = worksheet.getRow(rowNum);
        row.height = 20;

        const isEven = rowNum % 2 === 0;

        row.eachCell((cell, colIdx) => {
          // Default alignment & border
          cell.alignment = { vertical: 'middle' };
          cell.border = thinBorder;
          cell.font = { name: 'Arial', size: 10 };

          // Default row background zebra striping
          if (isEven) {
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLOR_LIGHT_GRAY } };
          }

          const valStr = String(cell.value || "").trim();

          // Column specific formatting
          if (colIdx === 1) {
            cell.alignment = { horizontal: 'center', vertical: 'middle' };
          }
          else if (colIdx === 4) {
            cell.alignment = { horizontal: 'center', vertical: 'middle' };
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLOR_LIGHT_BLUE_TYPE } };
            cell.font = { name: 'Arial', size: 10, color: { argb: COLOR_DARK_BLUE_TYPE } };
          }
          else if (colIdx === 5) {
            cell.alignment = { horizontal: 'center', vertical: 'middle' };
            const isActive = valStr === 'Active';
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: isActive ? COLOR_GREEN_ACTIVE : COLOR_RED_INACTIVE } };
            cell.font = { name: 'Arial', size: 10, bold: true, color: { argb: COLOR_WHITE } };
          }
          else if (colIdx === 7) {
            cell.alignment = { horizontal: 'center', vertical: 'middle' };
            const isGood = valStr === 'Good';
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: isGood ? COLOR_GREEN_ACTIVE : COLOR_RED_INACTIVE } };
            cell.font = { name: 'Arial', size: 10, bold: true, color: { argb: COLOR_WHITE } };
          }
          else if (colIdx === 8 && valStr) {
            cell.font = { name: 'Arial', size: 10, color: { argb: 'FF0563C1' }, underline: 'single' };
          }
          else if (colIdx === 11) {
            cell.alignment = { horizontal: 'center', vertical: 'middle' };
            if (valStr === 'Redesign') {
              cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLOR_GREEN_ACTIVE } };
              cell.font = { name: 'Arial', size: 10, bold: true, color: { argb: COLOR_WHITE } };
            } else if (valStr === 'Fresh') {
              cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLOR_PURPLE_FRESH } };
              cell.font = { name: 'Arial', size: 10, bold: true, color: { argb: COLOR_WHITE } };
            } else {
              cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLOR_LIGHT_GREEN_APP } };
              cell.font = { name: 'Arial', size: 10, color: { argb: COLOR_DARK_GREEN_APP } };
            }
          }
        });
      });

      // Auto-adjust column widths
      worksheet.columns.forEach((column, colIdx) => {
        let maxLen = 0;
        column.eachCell?.({ includeEmpty: true }, (cell) => {
          const val = String(cell.value || "");
          const valLen = (colIdx + 1) === 8 ? Math.min(val.length, 25) : val.length;
          maxLen = Math.max(maxLen, valLen);
        });
        column.width = Math.max(maxLen + 4, 12);
      });

      await workbook.xlsx.writeFile(exportPath);
      this.logger.log(`Excel report generated natively at: ${exportPath}`);
      return exportPath;

    } catch (e) {
      this.logger.error(`Failed to natively save leads to Excel: ${e.message}`);
      throw new InternalServerErrorException('Failed to generate Excel file natively');
    }
  }

  async syncToGoogleSheets(userId: number | null): Promise<string> {
    const sheetId = process.env.GOOGLE_SHEET_ID;
    if (!sheetId) {
      throw new InternalServerErrorException('No GOOGLE_SHEET_ID configured in environment');
    }

    const credentialsPath = path.join(this.rootDir, 'credentials.json');
    if (!fs.existsSync(credentialsPath)) {
      throw new NotFoundException('Google credentials file credentials.json not found in root workspace');
    }

    try {
      const leads = await this.leadsRepository.find({
        where: { userId: userId === null ? IsNull() : userId },
        order: { batch_id: 'DESC', id: 'ASC' }
      });

      const auth = new google.auth.GoogleAuth({
        keyFile: credentialsPath,
        scopes: ['https://www.googleapis.com/auth/spreadsheets'],
      });

      const sheets = google.sheets({ version: 'v4', auth });

      const HEADERS = [
        "S.No.",
        "School Name",
        "Customer Name",
        "Institution Type",
        "Social Media",
        "Area Name",
        "Institution Atmosphere",
        "Website URL",
        "Contact Number",
        "School Address",
        "Pincode",
        "Appearance",
        "Remarks"
      ];

      const values: string[][] = [HEADERS];
      leads.forEach((lead, idx) => {
        values.push([
          String(idx + 1),
          lead.school_name || "",
          "", // Customer Name
          lead.institution_type || "Matriculation",
          lead.social_media || "Inactive",
          lead.area_name || "",
          lead.atmosphere || "Good",
          lead.website_url || "",
          lead.contact_number || "",
          lead.address || "",
          lead.pincode || "",
          lead.appearance || "Redesign",
          lead.remarks || ""
        ]);
      });

      // Clear existing values in sheet
      await sheets.spreadsheets.values.clear({
        spreadsheetId: sheetId,
        range: 'Sheet1!A1:M1000',
      });

      // Write new values
      const response = await sheets.spreadsheets.values.update({
        spreadsheetId: sheetId,
        range: 'Sheet1!A1',
        valueInputOption: 'RAW',
        requestBody: { values },
      });

      const message = `Google Sheet synced successfully natively: ${response.data.updatedCells} cells updated.`;
      this.logger.log(message);
      return message;

    } catch (e) {
      this.logger.error(`Google Sheets native sync failed: ${e.message}`);
      throw new InternalServerErrorException(`Google Sheets sync failed: ${e.message}`);
    }
  }
}

// Small self reference trick inside promise callbacks
const self = {
  get rootDir() {
    return path.resolve(__dirname, '../../..');
  }
};
