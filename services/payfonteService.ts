
import { User } from '../types';

export interface PayfonteResponse {
  data: {
    action: 'processing' | 'redirect' | 'otp' | 'success' | 'failed';
    sessionId: string;
    provider: string;
    reference: string;
    amount: number;
    status: string;
    statusDescription: string;
    data?: {
      link?: string;
      message?: string;
    };
  };
  statusCode: number;
}

class PayfonteService {
  private baseUrl = 'https://api.payfonte.com/v1'; // URL imaginaire basée sur la spec
  private clientId = 'payfusion';

  /**
   * Initie une charge directe via Mobile Money
   */
  async initiateDirectCharge(params: {
    amount: number;
    provider: string;
    phone: string;
    customerCode?: string;
    user: User;
  }): Promise<PayfonteResponse> {
    // Dans une application réelle, cet appel se ferait via votre backend 
    // pour sécuriser les clés API. Ici nous simulons la réponse API Payfonte.
    
    console.log("Payfonte Request:", params);
    
    // Simulation des différents flux selon l'opérateur
    await new Promise(resolve => setTimeout(resolve, 1500));

    if (params.provider.includes('orange')) {
      // Orange nécessite souvent un OTP (Pre-OTP Flow)
      if (!params.customerCode) {
         return {
           data: {
             action: 'otp',
             sessionId: 'sess-' + Math.random().toString(36).substr(2, 9),
             provider: params.provider,
             reference: 'REF-' + Date.now(),
             amount: params.amount,
             status: 'pending',
             statusDescription: 'OTP Required'
           },
           statusCode: 201
         };
      }
    }

    if (params.provider === 'wave-ci' || params.provider.includes('redirect')) {
      return {
        data: {
          action: 'redirect',
          sessionId: 'v1nadjww8lwfxxd7giumi3dyik7pzaxrxqmyvdeuunvixo25jhqf4o6wzuxhjdzg',
          provider: params.provider,
          reference: 'DDC' + Date.now(),
          amount: params.amount,
          status: 'pending',
          // Fix: removed 'charge' property as it is not part of the PayfonteResponse data interface
          statusDescription: "Awaiting Provider's Feedback",
          data: {
            link: `https://pay.wave.com/m/M_ci_jwxwatdcoKS8/c/ci/?amount=${params.amount}`,
            message: "Cliquez pour payer"
          }
        },
        statusCode: 201
      };
    }

    // Par défaut : USSD Flow (Processing)
    return {
      data: {
        action: 'processing',
        sessionId: 'sess-' + Math.random().toString(36).substr(2, 9),
        provider: params.provider,
        reference: 'DDC' + Date.now(),
        amount: params.amount,
        status: 'pending',
        statusDescription: "Awaiting Provider's Feedback"
      },
      statusCode: 201
    };
  }

  /**
   * Vérifie l'état d'une transaction
   */
  async verifyTransaction(reference: string): Promise<'success' | 'failed' | 'pending'> {
    await new Promise(resolve => setTimeout(resolve, 2000));
    // Simuler un succès après quelques secondes
    return Math.random() > 0.1 ? 'success' : 'pending';
  }
}

export const payfonteService = new PayfonteService();
