import { Injectable } from '@nestjs/common';

import { ConfigService } from '@nestjs/config';

import { google } from 'googleapis';

@Injectable()
export class GoogleMeetService {

  private oauth2Client;

  constructor(
    private readonly configService:
      ConfigService,
  ) {

    console.log(
      'GOOGLE_MEET_CLIENT_ID:',
      this.configService.get<string>(
        'GOOGLE_MEET_CLIENT_ID',
      ),
    );

    console.log(
      'GOOGLE_MEET_CLIENT_SECRET:',
      this.configService.get<string>(
        'GOOGLE_MEET_CLIENT_SECRET',
      )
        ? 'CARGADO'
        : 'NO CARGADO',
    );

    console.log(
      'GOOGLE_MEET_REFRESH_TOKEN:',
      this.configService.get<string>(
        'GOOGLE_MEET_REFRESH_TOKEN',
      ),
    );

    this.oauth2Client =
      new google.auth.OAuth2(
        this.configService.get<string>(
          'GOOGLE_MEET_CLIENT_ID',
        ),

        this.configService.get<string>(
          'GOOGLE_MEET_CLIENT_SECRET',
        ),

        'https://developers.google.com/oauthplayground',
      );

    this.oauth2Client.setCredentials({
      refresh_token:
        this.configService.get<string>(
          'GOOGLE_MEET_REFRESH_TOKEN',
        ),
    });

    console.log(
      'GOOGLE OAUTH CLIENT CONFIGURADO',
    );
  }

  async createEvent(
    data: {
      start: Date;
      end: Date;
      email: string;
      name: string;
    },
  ) {

    console.log(
      '==============================',
    );

    console.log(
      'INICIANDO CREACION GOOGLE MEET',
    );

    console.log(
      'DATA RECIBIDA:',
      data,
    );

    const calendar =
      google.calendar({
        version: 'v3',

        auth:
          this.oauth2Client,
      });

    console.log(
      'CLIENTE CALENDAR CREADO',
    );

    try {

      console.log(
        'ENVIANDO REQUEST A GOOGLE...',
      );

      const response =
        await calendar.events.insert({
          calendarId:
            'primary',

          conferenceDataVersion: 1,

          sendUpdates: 'all',

          requestBody: {
            summary:
              'Reunión ViaCore',

            description:
              'Reunión agendada automáticamente desde ViaCore.',

            start: {
              dateTime:
                data.start.toISOString(),

              timeZone:
                'America/Argentina/Buenos_Aires',
            },

            end: {
              dateTime:
                data.end.toISOString(),

              timeZone:
                'America/Argentina/Buenos_Aires',
            },

            attendees: [
              {
                email:
                  data.email,

                displayName:
                  data.name,
              },
            ],

            conferenceData: {
              createRequest: {
                requestId:
                  `meet-${Date.now()}`,

                conferenceSolutionKey: {
                  type:
                    'hangoutsMeet',
                },
              },
            },
          },
        });

      console.log(
        'EVENTO GOOGLE CREADO EXITOSAMENTE',
      );

      console.log(
        'RESPONSE:',
        response.data,
      );

      const meetLink =
        response.data
          .conferenceData
          ?.entryPoints
          ?.find(
            (entry) =>
              entry.entryPointType ===
              'video',
          )?.uri || '';

      console.log(
        'MEET LINK:',
        meetLink,
      );

      console.log(
        'GOOGLE EVENT ID:',
        response.data.id,
      );

      return {
        meetLink,

        googleEventId:
          response.data.id || '',
      };

    } catch (error) {

      console.log(
        '==============================',
      );

      console.log(
        'ERROR CREANDO GOOGLE MEET',
      );

      console.log(
        'ERROR COMPLETO:',
        error,
      );

      console.log(
        'ERROR RESPONSE:',
        error?.response?.data,
      );

      console.log(
        'ERROR MESSAGE:',
        error?.message,
      );

      console.log(
        'ERROR STACK:',
        error?.stack,
      );

      console.log(
        '==============================',
      );

      throw error;
    }
  }

  async deleteEvent(
    eventId: string,
  ) {

    console.log(
      'ELIMINANDO EVENTO:',
      eventId,
    );

    const calendar =
      google.calendar({
        version: 'v3',

        auth:
          this.oauth2Client,
      });

    await calendar.events.delete({
      calendarId:
        'primary',

      eventId,

      sendUpdates:
        'all',
    });

    console.log(
      'EVENTO ELIMINADO',
    );

    return {
      deleted: true,
    };
  }

  async updateEvent(
    eventId: string,

    start: Date,

    end: Date,
  ) {

    console.log(
      'ACTUALIZANDO EVENTO:',
      eventId,
    );

    const calendar =
      google.calendar({
        version: 'v3',

        auth:
          this.oauth2Client,
      });

    await calendar.events.patch({
      calendarId:
        'primary',

      eventId,

      sendUpdates:
        'all',

      requestBody: {
        start: {
          dateTime:
            start.toISOString(),

          timeZone:
            'America/Argentina/Buenos_Aires',
        },

        end: {
          dateTime:
            end.toISOString(),

          timeZone:
            'America/Argentina/Buenos_Aires',
        },
      },
    });

    console.log(
      'EVENTO ACTUALIZADO',
    );

    return {
      updated: true,
    };
  }
}
