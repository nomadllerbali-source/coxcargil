import { supabase } from './supabase';
import type { B2BAgent, AgentCommissionOverride } from '../types/database';

interface CommissionOverrideWithRelations extends AgentCommissionOverride {
  b2b_agents?: B2BAgent;
}

export async function getAgentCommissionPercentage(
  agentId: string,
  propertyTypeId: string,
  bookingDate: string
): Promise<number> {
  try {
    const { data: agent, error: agentError } = await supabase
      .from('b2b_agents')
      .select('commission_percentage')
      .eq('id', agentId)
      .eq('status', 'approved')
      .maybeSingle();

    if (agentError) throw agentError;
    if (!agent) throw new Error('Agent not found or not approved');

    const defaultCommission = agent.commission_percentage || 10;

    const { data: overrides, error: overridesError } = await supabase
      .from('agent_commission_overrides')
      .select('*')
      .eq('is_active', true)
      .lte('start_date', bookingDate)
      .gte('end_date', bookingDate);

    if (overridesError) throw overridesError;

    if (!overrides || overrides.length === 0) {
      return defaultCommission;
    }

    const applicableOverride = overrides.find(
      (override) =>
        override.agent_id === agentId && override.property_type_id === propertyTypeId
    );
    if (applicableOverride) {
      return applicableOverride.commission_percentage;
    }

    const agentOverride = overrides.find(
      (override) => override.agent_id === agentId && !override.property_type_id
    );
    if (agentOverride) {
      return agentOverride.commission_percentage;
    }

    const propertyOverride = overrides.find(
      (override) => !override.agent_id && override.property_type_id === propertyTypeId
    );
    if (propertyOverride) {
      return propertyOverride.commission_percentage;
    }

    return defaultCommission;
  } catch (error) {
    console.error('Error getting agent commission:', error);
    return 10;
  }
}

export function calculateB2BPrice(regularPrice: number, commissionPercentage: number): number {
  const discount = (regularPrice * commissionPercentage) / 100;
  return regularPrice - discount;
}

export async function validateAgent(agentId: string): Promise<{
  valid: boolean;
  agent?: B2BAgent;
  error?: string;
}> {
  try {
    const { data: agent, error } = await supabase
      .from('b2b_agents')
      .select('*')
      .eq('id', agentId)
      .maybeSingle();

    if (error) {
      return { valid: false, error: 'Database error while validating agent' };
    }

    if (!agent) {
      return { valid: false, error: 'Agent ID not found' };
    }

    if (agent.status !== 'approved') {
      return { valid: false, error: `Agent status is ${agent.status}. Only approved agents can book.` };
    }

    return { valid: true, agent };
  } catch (error) {
    console.error('Error validating agent:', error);
    return { valid: false, error: 'Failed to validate agent' };
  }
}
