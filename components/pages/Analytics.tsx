import React from 'react';
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Doc, Id } from "../../convex/_generated/dataModel";
import Header from '../Header';
import DataTable from '../DataTable';
import { TableRowData, LeadRecord, SaleRecord } from '../../types';

const startTs = Date.now() - 30 * 24 * 60 * 60 * 1000;
const endTs = Date.now();

interface AnalyticsProps {
  project: Doc<"projects">;
  userId: Id<"users">;
}

const Analytics: React.FC<AnalyticsProps> = ({ project, userId }) => {
  const tableData = useQuery(api.analytics.getHierarchicalData, {
    projectId: project._id,
    startTs,
    endTs,
  });

  const rawLeads = useQuery(api.leads.listByProject, {
    projectId: project._id,
  });

  const rawSales = useQuery(api.sales.listByProject, {
    projectId: project._id,
  });

  if (tableData === undefined || rawLeads === undefined || rawSales === undefined) {
    return (
      <div>
        <Header projectName={project.name} />
        <div className="bg-white rounded-2xl p-6 animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4" />
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="h-12 bg-gray-100 rounded" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Map Convex lead documents to LeadRecord interface
  const leadRecords: LeadRecord[] = rawLeads.map((lead) => ({
    id: lead._id,
    creationDate: new Date(lead.createdAt).toISOString().split('T')[0],
    phone: lead.phone,
    contactType: lead.contactType,
    deal: lead.externalDealId ?? '',
    leadType: lead.leadType,
    budget: lead.budget,
    status: lead.status,
    pipeline: lead.pipeline,
    ad: lead.adName ?? '',
    creative: lead.creativeName ?? '',
    project: lead.campaignName ?? '',
    campaign: lead.campaignName ?? '',
    group: lead.adGroupName ?? '',
    responsible: lead.responsible ?? '',
    utmSource: lead.utmSource ?? '',
    utmMedium: lead.utmMedium ?? '',
    utmCampaign: lead.utmCampaign ?? '',
    utmContent: lead.utmContent ?? '',
    utmTerm: lead.utmTerm ?? '',
  }));

  // Map Convex sale documents to SaleRecord interface
  const saleRecords: SaleRecord[] = rawSales.map((sale) => {
    const daysToSale = sale.daysToSale ?? 0;
    return {
      id: sale._id,
      creationDate: sale.registrationDateStr,
      phone: sale.clientPhone ?? '',
      contactType: '',
      deal: sale.externalDealId ?? '',
      leadType: '',
      budget: sale.amount,
      status: sale.dealStatus,
      pipeline: '',
      ad: sale.adName ?? '',
      creative: sale.creativeName ?? '',
      project: sale.campaignName ?? '',
      campaign: sale.campaignName ?? '',
      group: sale.adGroupName ?? '',
      responsible: sale.responsible ?? '',
      utmSource: sale.utmSource ?? '',
      utmMedium: sale.utmMedium ?? '',
      utmCampaign: sale.utmCampaign ?? '',
      utmContent: sale.utmContent ?? '',
      utmTerm: sale.utmTerm ?? '',
      saleDate: sale.saleDateStr,
      dealCycle: `${daysToSale} дней`,
    };
  });

  return (
    <div>
      <Header projectName={project.name} />
      <DataTable data={tableData as TableRowData[]} leadRecords={leadRecords} saleRecords={saleRecords} />
    </div>
  );
};

export default Analytics;
