import { useEffect, useRef } from 'react';
import resourceService from '../services/resourceService';

/**
 * Custom hook to monitor resource events and trigger notifications
 */
export const useResourceEvents = (colonyId, options = {}) => {
  const {
    pollInterval = 5000, // Check every 5 seconds
    enableNotifications = true,
    autoProcessDecay = false
  } = options;

  const lastEventCheck = useRef(Date.now());
  const intervalRef = useRef(null);

  /**
   * Check for new events and conversions
   */
  const checkForEvents = async () => {
    try {
      if (!colonyId) return;

      // Get active events and conversions
      const [events, conversions] = await Promise.all([
        resourceService.getActiveEvents(colonyId),
        resourceService.getActiveConversions(colonyId)
      ]);

      // Filter for new events since last check
      const newEvents = events.filter(event => {
        const eventTime = new Date(event.created_at || event.timestamp).getTime();
        return eventTime > lastEventCheck.current;
      });

      // Filter for completed conversions
      const completedConversions = conversions.filter(conversion => 
        conversion.status === 'completed' && 
        new Date(conversion.completionTime).getTime() > lastEventCheck.current
      );

      // Process new events
      if (enableNotifications && window.notificationSystem) {
        newEvents.forEach(event => {
          const isPositive = event.type.includes('bonus') || event.type.includes('discovery');
          const isNegative = event.type.includes('attack') || event.type.includes('decay');

          if (isPositive) {
            window.notificationSystem.showEvent(
              'Positive Event!',
              `${event.title || event.type}: ${event.description || 'Something good happened!'}`,
              { eventType: event.type, effects: event.effects }
            );
          } else if (isNegative) {
            window.notificationSystem.showEvent(
              'Alert: Negative Event',
              `${event.title || event.type}: ${event.description || 'Something requires attention!'}`,
              { eventType: event.type, effects: event.effects }
            );
          } else {
            window.notificationSystem.showEvent(
              'Event Occurred',
              `${event.title || event.type}: ${event.description || 'An event has occurred'}`,
              { eventType: event.type, effects: event.effects }
            );
          }
        });

        // Process completed conversions
        completedConversions.forEach(conversion => {
          window.notificationSystem.showConversion(
            'Conversion Complete',
            `Resource conversion finished: ${conversion.recipeName || 'Unknown recipe'}`,
            { 
              conversionId: conversion.id,
              inputResources: conversion.inputResources,
              outputResources: conversion.outputResources,
              efficiency: conversion.efficiency
            }
          );
        });
      }

      // Update last check time
      lastEventCheck.current = Date.now();

      // Auto-process decay if enabled
      if (autoProcessDecay) {
        try {
          await resourceService.processResourceDecay(colonyId);
        } catch (error) {
          console.warn('Failed to auto-process decay:', error);
        }
      }

      return { events, conversions, newEvents, completedConversions };
    } catch (error) {
      console.error('Error checking for resource events:', error);
      
      if (enableNotifications && window.notificationSystem) {
        window.notificationSystem.showError(
          'Event Check Failed',
          'Failed to check for resource events: ' + error.message
        );
      }
      
      return { events: [], conversions: [], newEvents: [], completedConversions: [] };
    }
  };

  /**
   * Monitor resource decay and send warnings
   */
  const checkResourceDecay = async () => {
    try {
      if (!colonyId || !enableNotifications) return;

      const resources = await resourceService.getColonyResources(colonyId);
      
      // Check for resources approaching critical decay
      const criticalResources = resources.filter(resource => {
        const quality = resource.quality || 100;
        return quality <= 30 && quality > 10; // Warn when below 30% but above 10%
      });

      const spoiledResources = resources.filter(resource => {
        const quality = resource.quality || 100;
        return quality <= 10; // Critical when below 10%
      });

      // Send decay warnings
      if (criticalResources.length > 0 && window.notificationSystem) {
        window.notificationSystem.showDecay(
          'Resource Decay Warning',
          `${criticalResources.length} resource${criticalResources.length > 1 ? 's are' : ' is'} approaching spoilage`,
          { 
            criticalCount: criticalResources.length,
            resourceTypes: criticalResources.map(r => r.type).join(', ')
          }
        );
      }

      if (spoiledResources.length > 0 && window.notificationSystem) {
        window.notificationSystem.showDecay(
          'Critical: Resources Spoiled!',
          `${spoiledResources.length} resource${spoiledResources.length > 1 ? 's have' : ' has'} spoiled and should be removed`,
          { 
            spoiledCount: spoiledResources.length,
            resourceTypes: spoiledResources.map(r => r.type).join(', ')
          }
        );
      }

      return { criticalResources, spoiledResources };
    } catch (error) {
      console.error('Error checking resource decay:', error);
      return { criticalResources: [], spoiledResources: [] };
    }
  };

  /**
   * Manually trigger an event check
   */
  const triggerEventCheck = () => {
    return checkForEvents();
  };

  /**
   * Manually trigger decay check
   */
  const triggerDecayCheck = () => {
    return checkResourceDecay();
  };

  // Set up polling interval
  useEffect(() => {
    if (!colonyId) return;

    // Initial check
    checkForEvents();
    checkResourceDecay();

    // Set up interval
    intervalRef.current = setInterval(() => {
      checkForEvents();
      checkResourceDecay();
    }, pollInterval);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [colonyId, pollInterval, enableNotifications, autoProcessDecay]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  return {
    triggerEventCheck,
    triggerDecayCheck,
    checkForEvents,
    checkResourceDecay
  };
}; 